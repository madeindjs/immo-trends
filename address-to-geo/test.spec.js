const { find } = require("./index");

describe(find.name, () => {
  it("should", async () => {
    expect(await find({ zipCode: "69330", town: "Pusignan", street: "Rue de la Cerisiere", number: "1" })).toEqual({
      lon: 5.068994,
      lat: 45.761899,
    });
  });
});
