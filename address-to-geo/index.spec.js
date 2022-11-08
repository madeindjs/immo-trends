const { findByAddress, _knex } = require("./index");

describe(findByAddress.name, () => {
  afterAll(() => {
    _knex.destroy();
  });

  it.each([
    [
      { zipCode: "69330", town: "Pusignan", street: "Rue de la Cerisiere", number: "1" },
      { lon: 5.068994, lat: 45.761899 },
    ],
    [
      { zipCode: "69330", town: "Meyzieu", street: "Rue Paul Bourget", number: "5" },
      { lon: 5.00256, lat: 45.78496 },
    ],
    [
      { zipCode: "01640", town: "L'Abergement-de-Varey", street: "Route de Nivollet", number: "289" },
      { lon: 5.427041, lat: 46.001999 },
    ],
  ])("should find address", async (addresse, geo) => {
    expect(await findByAddress(addresse)).toEqual(geo);
  });

  it.each([
    [
      { zipCode: "1640", town: "L'Abergement-de-Varey", street: "Route de Nivollet", number: "289" },
      { lon: 5.427041, lat: 46.001999 },
    ],
  ])("should find address with incomplete zip code", async (addresse, geo) => {
    expect(await findByAddress(addresse)).toEqual(geo);
  });
});
