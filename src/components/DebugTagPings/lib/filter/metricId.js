import { getMapKeysInDescendingOrderByValue, insertOrIncrementValueInMapByKey } from './utils';

/**
 * Extract all unique metric IDs from a list of pings. Metric IDs are pulled
 * from a ping's `metrics` and `events`.
 *
 * @param {Object[]} pings Array of pings to search.
 * @returns {string[]} All unique metric IDs from the array of pings.
 */
export const aggregateMetricIds = (pings) => {
  // If there are no pings, then we can't aggregate.
  if (!pings.length) {
    return [];
  }

  // Create an array of just the ping payloads that we will parse.
  const payloads = pings.map((ping) => ping.payload);

  // Dictionary to store metric IDs and counts so when we can display the
  // IDs in descending order of occurrence.
  let metricIdCounts = new Map();

  payloads.forEach((payload) => {
    try {
      const payloadObj = JSON.parse(payload);

      // Extract all metric IDs from metrics.
      if (payloadObj && payloadObj.metrics) {
        const metrics = payloadObj.metrics;

        // Iterate over all keys of `metrics`, which are Glean metric types.
        // These will always have consistent naming.
        Object.keys(metrics).forEach((metricType) => {
          // Iterate over all keys of a metric type. Each child key of
          // the metric type is a metric ID.
          Object.keys(metrics[metricType]).forEach((metricId) => {
            metricIdCounts = insertOrIncrementValueInMapByKey(metricIdCounts, metricId);
          });
        });
      }

      // Extract all metric IDs from events.
      if (payloadObj && payloadObj.events && payloadObj.events.length) {
        const events = payloadObj.events;

        // Metric IDs in events are generated by combining both the event
        // category and the event name.
        events.forEach((event) => {
          const eventMetricId = `${event.category}.${event.name}`;
          metricIdCounts = insertOrIncrementValueInMapByKey(metricIdCounts, eventMetricId);
        });
      }
    } catch (e) {
      console.error(e);
    }
  });

  return getMapKeysInDescendingOrderByValue(metricIdCounts);
};

/**
 * Apply `metricId` filter to list of pings. This checks for metric IDs in
 * both the `metrics` object as well as the `events` array.
 *
 * For events, a metric ID is generated by combining both the `category` and
 * the `name`. The name is everything after the final period, the category
 * is everything before the final period, since categories can include periods.
 *
 * @param {Object[]} pings All pings to filter.
 * @param {string} metricId The metric ID we are filtering by.
 * @returns {Object[]} All ping payloads that include the `metricId`.
 */
export const filterOnMetricId = (pings, metricId) => {
  // If there is no filter applied, we return all pings.
  if (!metricId) {
    return pings;
  }

  // Iterate over all pings and look for ones that include the `metricId`.
  return pings.filter((ping) => {
    try {
      const payloadObj = JSON.parse(ping.payload);
      if (payloadObj && payloadObj.metrics) {
        const metrics = payloadObj.metrics;

        // Iterate over the metrics and see if the ping contains the
        // `metricId` we are looking for.
        const hasMetricId = Object.keys(metrics).some((metricType) => {
          // Iterate over all keys of a metric type. Each child key of
          // the metric type is a metric ID.
          return Object.keys(metrics[metricType]).some((metricKey) => metricKey === metricId);
        });

        if (hasMetricId) {
          return true;
        }
      }

      if (payloadObj && payloadObj.events && payloadObj.events.length) {
        const events = payloadObj.events;

        // Iterate over the events and see if any of the events contain the
        // `metricId` we are looking for.
        const hasEventMetricId = events.some((event) => {
          // Safety check to ensure we don't try to access a property
          // of a null or undefined value.
          if (!event || !event.category || !event.name) {
            return false;
          }

          const metricIdParts = metricId.split('.');

          // The `name` will always be everything after the final period.
          const name = metricIdParts.pop();

          // The `category` can contain periods, so it includes everything
          // before the final period.
          const category = metricIdParts.join('.');

          // Check that pieces of the metric ID match up.
          return event.category === category && event.name === name;
        });

        if (hasEventMetricId) {
          return true;
        }
      }
    } catch (e) {
      console.error(e);
    }

    return false;
  });
};