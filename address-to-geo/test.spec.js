const { find, _knex } = require("./index");

describe(find.name, () => {
  afterAll(() => {
    _knex.destroy();
  });

  it("should", async () => {
    expect(await find({ zipCode: "69330", town: "Pusignan", street: "Rue de la Cerisiere", number: "1" })).toEqual({
      lon: 5.068994,
      lat: 45.761899,
    });
  });

  it("should 2", async () => {
    expect(await find({ zipCode: "69330", town: "Meyzieu", street: "Rue Paul Bourget", number: "5" })).toEqual({
      lon: 5.00256,
      lat: 45.78496,
    });
  });
});
