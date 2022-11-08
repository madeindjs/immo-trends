const { completeZipCode } = require("./utils");

describe(completeZipCode.name, () => {
  it("should not change", () => expect(completeZipCode("69330")).toEqual("69330"));

  it("should not change", () => expect(completeZipCode("1234")).toEqual("01234"));
});
