process.env.MUXER_EVENTS_API = "http://localhost/events";

const { prefix, resolved } = require("../test-utils");
const { getFromS3 } = require(`${prefix}/node_modules/aws-lambda-data-utils`);
const request = require(`${prefix}/node_modules/request`);
const publisher = require(`${prefix}/handlers/publisher`);

const requireData = filename =>
  JSON.stringify(require(`./test-data/${filename}.json`)); // eslint-disable-line global-require

const emptyEventsList = requireData("events-payload-empty");
const incompleteEventsList = requireData("events-payload-incomplete");
const populatedEventsList = requireData("events-payload-populated");

const context = null;
let event;

describe("Publisher", function() {
  beforeEach(function() {
    jest.clearAllMocks();
    event = null;
  });

  it("is a lambda handler", function() {
    expect(typeof publisher).toBe("object");
    expect(typeof publisher.publish).toBe("function");
  });

  describe("when no new file is added to the bucket", function() {
    beforeEach(function() {
      event = {
        Records: []
      };
    });

    it("does not return an error and returns success message", function(done) {
      publisher.publish(event, context, function(err, response) {
        expect(err).toBe(null);
        expect(response).toEqual({ message: "Events added to Muxer" });
        done();
      });
    });

    it("does not make any requests", function(done) {
      publisher.publish(event, context, function() {
        expect(request).toHaveBeenCalledTimes(0);
        done();
      });
    });
  });

  describe("when a new file is added to the bucket", function() {
    beforeEach(function() {
      event = {
        Records: [
          {
            s3: {
              bucket: "test-muxer-bucket",
              object: { Key: "path/to/events.json" }
            }
          }
        ]
      };
    });

    describe("which contains no events", function() {
      beforeEach(function() {
        getFromS3.mockImplementation(resolved({ Body: emptyEventsList }));
      });

      it("does not return an error and returns success message", function(done) {
        publisher.publish(event, context, function(err, response) {
          expect(err).toBe(null);
          expect(response).toEqual({ message: "Events added to Muxer" });
          done();
        });
      });

      it("does not make any requests", function(done) {
        publisher.publish(event, context, function() {
          expect(request).toHaveBeenCalledTimes(0);
          done();
        });
      });
    });

    describe("which contains an incomplete event", function() {
      beforeEach(function() {
        jest.spyOn(global.console, "log").mockImplementation(() => {});
        getFromS3.mockImplementation(resolved({ Body: incompleteEventsList }));
      });

      it("does not return an error and returns success message", function(done) {
        publisher.publish(event, context, function(err, response) {
          expect(err).toBe(null);
          expect(response).toEqual({ message: "Events added to Muxer" });
          done();
        });
      });

      it("filters out invalid event from requests", function(done) {
        publisher.publish(event, context, function() {
          expect(request).toHaveBeenCalledTimes(7);
          expect(request.mock.calls).toMatchSnapshot();
          done();
        });
      });

      it("outputs warning", function(done) {
        /* eslint-disable no-console */
        publisher.publish(event, context, function() {
          expect(console.log).toHaveBeenCalledTimes(1);
          expect(console.log).toHaveBeenCalledWith(
            "WARNING: some events generated were not valid!"
          );
          done();
        });
      });
    });

    describe("which contains complete events", function() {
      beforeEach(function() {
        getFromS3.mockImplementation(resolved({ Body: populatedEventsList }));
      });

      it("does not return an error and returns message", function(done) {
        publisher.publish(event, context, function(err, response) {
          expect(err).toBe(null);
          expect(response).toEqual({ message: "Events added to Muxer" });
          done();
        });
      });

      it("sends events to the service", function(done) {
        publisher.publish(event, context, function() {
          expect(request).toHaveBeenCalledTimes(8);
          expect(request.mock.calls).toMatchSnapshot();
          done();
        });
      });
    });
  });

  describe("when multiple new files are added to the bucket", function() {
    beforeEach(function() {
      event = {
        Records: [
          {
            s3: {
              bucket: "test-muxer-bucket",
              object: { Key: "path/to/events-1.json" }
            }
          },
          {
            s3: {
              bucket: "test-muxer-bucket",
              object: { Key: "path/to/events-2.json" }
            }
          }
        ]
      };

      getFromS3
        .mockReturnValueOnce(resolved({ Body: populatedEventsList })())
        .mockReturnValueOnce(resolved({ Body: populatedEventsList })());
    });

    it("does not return an error and returns message", function(done) {
      publisher.publish(event, context, function(err, response) {
        expect(err).toBe(null);
        expect(response).toEqual({ message: "Events added to Muxer" });
        done();
      });
    });

    it("sends events to the service", function(done) {
      publisher.publish(event, context, function() {
        expect(request).toHaveBeenCalledTimes(16);
        expect(request.mock.calls).toMatchSnapshot();
        done();
      });
    });
  });
});
