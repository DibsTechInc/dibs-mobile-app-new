/**
 *
 * @param {object} pkg studio package
 * @returns {string} text to display
 */
export default function formatAutopayTimeText(pkg) {
  const length = pkg.notification_period || pkg.commitment_period;
  const noticeText = `${length} month notice required to cancel auto-renew`;
  const commitmentText = length > 0 ? `${length} month commitment` : '';

  const textToShow = pkg.notification_period > 0 ? noticeText : commitmentText;

  return textToShow;
}
