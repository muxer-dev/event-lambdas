"use strict";

const util = require("util");
const request = util.promisify(require("request"));
const { getFromS3 } = require("aws-lambda-data-utils");
const { validate } = require("jsonschema");
const eventSchema = require("@muxer/event-schema");
const { muxerEventsApi } = require("../config");

const isValidEvent = event => validate(event, eventSchema).errors.length === 0;

const convert = ({
  name,
  description,
  url,
  times,
  topics,
  charge,
  source_data: sourceData
}) => ({
  name,
  description,
  url,
  start: times.start.utc,
  end: times.end.utc,
  duration: times.duration,
  topics: topics,
  entry: charge.is_free ? ["free"] : ["ticket"],
  category: "technology",
  source: sourceData.name,
  // source_id: sourceData.id,
  location: "belfast"
});

const makeRequestFor = event =>
  request({
    method: "POST",
    url: muxerEventsApi,
    json: true,
    body: convert(event)
  }).then(function(response) {
    console.log(convert(event));
    if (`${response.statusCode}`.startsWith(2)) return response;
    throw new Error(`Unsuccessful request; ${response.statusCode}`);
  });

module.exports.publish = async (event, context, callback) => {
  try {
    const records = event.Records;

    const eventsFiles = await Promise.all(
      await records.map(async function({ s3: { bucket, object: file } }) {
        const data = await getFromS3(bucket.name, file.key);
        const events = JSON.parse(data.Body.toString());
        const validEvents = events.filter(isValidEvent);

        if (validEvents.length !== events.length) {
          console.log("WARNING: some events generated were not valid!"); // eslint-disable-line no-console
        }

        return validEvents;
      })
    );

    const savedEvents = [].concat.apply([], eventsFiles);

    await Promise.all(
      savedEvents.map(savedEvent => makeRequestFor(savedEvent))
    );

    callback(null, { message: "Events added to Muxer" });
  } catch (err) {
    callback(err, null);
  }
};
