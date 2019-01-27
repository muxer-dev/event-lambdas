module.exports = {
  buckets: () => ({
    eventsBucket: "muxer-events"
  }),
  muxerEventsApi: process.env.MUXER_EVENTS_API
};
