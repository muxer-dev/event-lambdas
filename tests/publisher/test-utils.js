jest.mock("../../publisher/node_modules/aws-lambda-data-utils", () => ({
  getFromS3: jest.fn()
}));

jest.mock("../../publisher/node_modules/request");

require("../../publisher/node_modules/request").mockImplementation(
  (options, callback) => {
    if (callback) callback(null, { statusCode: 202 });
  }
);

const prefix = "../../../publisher";

const resolved = data => () => Promise.resolve(data);

const resolvedResponse = data => Promise.resolve(JSON.stringify(data));

module.exports = {
  prefix,
  resolved,
  resolvedResponse
};
