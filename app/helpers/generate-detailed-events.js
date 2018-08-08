import Decimal from 'decimal.js';
import { format as formatCurrency } from 'currency-formatter';
import moment from 'moment-timezone';

/**
 * @param {Array<Object>} items upcoming class transaction grouped by class
 * @param {string} currency code of studio
 * @param {string} timeFormat for clock times
 * @param {string} shortDateFormat for calendar dates
 * @param {Array<Object>} locations studio locs
 * @returns {Array<Object>} upcoming events for expanded slider
 */
export default function generateDetailedEvents(items, currency, timeFormat, shortDateFormat, locations) {
  return items.map(({ location, instructor, ...item }) => {
    const chargeAmount = Decimal(item.amount).minus(item.studio_credits_spent).minus(item.global_credits_spent).minus(item.raf_credits_spent);
    const eventLocation = locations.length && locations.find(l => l.id === location.id);
    const { latitude, longitude } = eventLocation;
    const localStartTime = moment.tz(item.start_time, item.mainTZ);
    const formatTime = time => (
      time.get('minute') || timeFormat !== 'LT' ?
        time.format(timeFormat) : time.format('hA')
    );

    let formattedDescription = item.description;

    if (!formattedDescription || formattedDescription.length <= 1) {
      formattedDescription = '';
    }

    return {
      ...item,
      shortDayOfWeek: localStartTime.format('ddd'),
      shortEventDate: localStartTime.format(shortDateFormat),
      formattedSubtotal: formatCurrency(item.original_price, { code: currency, precision: (item.original_price % 1 && 2) }),
      formattedTaxAmount: formatCurrency(item.tax_amount, { code: currency, precision: (item.tax_amount % 1 && 2) }),
      formattedDiscountAmount: formatCurrency(item.discount_amount, { code: currency, precision: (item.discount_amount % 1 && 2) }),
      formattedStudioCreditAmount: formatCurrency(item.studio_credits_spent, { code: currency, precision: (item.studio_credits_spent % 1 && 2) }),
      formattedRAFCreditAmount: formatCurrency(item.raf_credits_spent, { code: currency, precision: (item.studio_credits_spent % 1 && 2) }),
      formattedTotal: formatCurrency(chargeAmount, { code: currency, precision: (chargeAmount % 1 && 2) }),
      formattedValueBack: formatCurrency(item.valueBack, { code: currency, precision: (chargeAmount % 1 && 2) }),
      formattedStartTime: formatTime(localStartTime),
      longitude,
      latitude,
      locationName: location.name,
      instructorName: instructor.name,
      formattedDescription,
    };
  });
}
