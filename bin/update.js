/* eslint-disable import/no-extraneous-dependencies */
const config = require('./config');
const program = require('commander');
const Sequelize = require('sequelize');
const Promise = require('bluebird');
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
const { spawn } = require('child_process');

const ALL_STUDIOS_QUERY =
  'SELECT app_json AS "appJson", app_config_json AS "configJson" FROM dibs_studios WHERE app_json IS NOT NULL AND (NOT $prod OR "liveMobileApp");';
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

/**
 * @param {Object} SQL query result which contains app.json and config.json
 * @returns {Object} result of the publish for a particular studio
 */
async function updateStudioApp({ appJson, configJson }) {
  const dibsStudioId = configJson.DIBS_STUDIO_ID;
  try {
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
    fs.writeFileSync(
      path.join(APP_ROOT, '/app.json'),
      new Buffer(JSON.stringify(appJson)));
    fs.writeFileSync(
      path.join(APP_ROOT, '/config.json'),
      new Buffer(JSON.stringify(configJson)));
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

    // Publish update
    console.log(`Starting publish process for studio ${dibsStudioId}...`);
    const releaseChannel = configJson[`RELEASE_CHANNEL_${program.prod ? 'PROD' : 'DEV'}`];
    await new Promise((resolve, reject) => {
      const publish = spawn('exp', ['publish', '--release-channel', releaseChannel]);
      publish.stdout.on('data', data => console.log(data.toString()));
      publish.stderr.on('data', data => console.log(data.toString()));
      publish.on('exit', code => (code ?
        reject(new Error(`Failed to publish the app for studio ${dibsStudioId}`))
        : resolve()));
    });
    console.log(`Finished publish for studio ${dibsStudioId}.\n`);
    return { success: true };
  } catch (err) {
    console.log('\nERROR PUBLISHING UPDATE:');
    console.log(`Failed to update app for studio ${dibsStudioId}:\n`);
    console.log(err);
    return { success: false, dibs_studio_id: dibsStudioId };
  }
}

(async function updateApp() {
  try {
    program
      .option('-a, --all', 'Update all studios')
      .option('-s, --studio <dibs_studio_ids>', 'Studio ID to update', parseInt)
      .option('-p, --prod', 'Publishes app build to production release channels')
      .parse(process.argv);
    if (!program.all && !program.studio) {
      console.log('You must provide either the --all or --studios option');
      process.exit(1);
    }

    const configs = await sequelize.query(
      ...(program.all ? [
        ALL_STUDIOS_QUERY,
        { bind: { prod: Boolean(program.prod) },
          type: sequelize.QueryTypes.SELECT },
      ] : [
        STUDIO_QUERY,
        { bind: { id: program.studio },
          type: sequelize.QueryTypes.SELECT },
      ])
    );

    const results = await Promise.map(
      configs,
      updateStudioApp,
      { concurrency: 1 }
    );

    const successfulPublishes = results.filter(r => r.success);
    const failedPublishes = results.filter(r => !r.success);

    if (successfulPublishes.length === results.length) {
      console.log('\nThe update published to each studio app successfully!');
    } else if (successfulPublishes.length && results.length > 1) {
      console.log(`\nSuccessfully published the update to ${successfulPublishes.length}/${results.length} apps.`);
      console.log(`Failed to publish updates to studios: ${failedPublishes.map(r => r.dibs_studio_id).join(', ')}\nSee errors above for details.`);
    } else {
      console.log('\nFailed to publish the update to each app. See error(s) above for details.');
    }

    process.exit(0);
  } catch (err) {
    console.log('\nERROR PUBLISHING UPDATE:\n');
    console.log(err);
    process.exit(1);
  }
}());
