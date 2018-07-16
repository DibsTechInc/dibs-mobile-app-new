/* eslint-disable import/no-extraneous-dependencies */
const program = require('commander');
const Sequelize = require('sequelize');
const config = require('./config/sequelize');
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
const beautifyJsons = require('./helpers/beautify-jsons');
const Promise = require('bluebird');

const STUDIO_QUERY =
  'SELECT app_json AS "appJson", app_config_json AS "configJson" FROM dibs_studios WHERE id = $id;';

const APP_ROOT = path.join(__dirname, '..');
const S3_BUCKET = 'dibs-mobile-assets';

const sequelize = new Sequelize(process.env.DATABASE_URL, config);

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});
const s3 = new AWS.S3();
const getObjectAsync = Promise.promisify(s3.getObject, { context: s3 });

(async function downloadAppAssets() {
  try {
    program
      .option('-s, --studio <dibs_studio_id>', 'Studio ID to update', parseInt)
      .parse(process.argv);
    if (!program.studio) {
      console.log('You must provide the --studio option. Run node bin/download-assets --help for more info.');
      process.exit(1);
    }

    const [{ appJson, configJson }] = await sequelize.query(
      STUDIO_QUERY,
      {
        bind: { id: program.studio },
        type: sequelize.QueryTypes.SELECT,
      }
    );
    const dibsStudioId = configJson.DIBS_STUDIO_ID;
    const getS3Object = key => getObjectAsync({
      Bucket: S3_BUCKET,
      Key: `${configJson.S3_DIRNAME}/${key}`,
    });
    const writeFile = (filename, data) => fs.writeFileSync(
      path.join(APP_ROOT, filename),
      data
    );

    // Overwriting config files
    console.log(`Overwriting config JSONs for studio ${dibsStudioId}...`);
    writeFile('/app.json', new Buffer(JSON.stringify(appJson)));
    writeFile('/config.json', new Buffer(JSON.stringify(configJson)));
    console.log(`Finished overwriting config JSONs for studio ${dibsStudioId}.\n`);

    // Overwriting fonts
    console.log(`Overwriting font files for studio ${dibsStudioId}...`);
    const regularFont = await getS3Object(`${configJson.STUDIO_FONT}-Regular.ttf`);
    const boldFont = await getS3Object(`${configJson.STUDIO_FONT}-Bold.ttf`);
    writeFile('/assets/fonts/Regular.ttf', regularFont.Body);
    writeFile('/assets/fonts/Bold.ttf', boldFont.Body);
    console.log(`Finished overwriting font files for studio ${dibsStudioId}.\n`);

    // Overwriting assets
    console.log(`Overwriting image files for studio ${dibsStudioId}...`);
    const iconImg = await getS3Object('icon.png');
    const splashImg = await getS3Object('splash.png');
    const mainPageImg = await getS3Object('main-page.png');
    writeFile('/assets/icon.png', iconImg.Body);
    writeFile('/assets/splash.png', splashImg.Body);
    writeFile('/assets/img/main-page.png', mainPageImg.Body);
    console.log(`Finished overwriting image files for studio ${dibsStudioId}.\n`);

    beautifyJsons();
    process.exit(0);
  } catch (err) {
    console.log('\nERROR DOWNLOADING ASSETS:\n');
    console.log(err);
    process.exit(1);
  }
}());
