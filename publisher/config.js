module.exports = {
  buckets: () => ({
    eventsBucket: "muxer-transformed-events"
  }),
  muxerEventsApi: process.env.MUXER_EVENTS_API
};
