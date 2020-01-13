import {
  getAllCustomProperties,
  nonDesignLangaugeCustomProperties,
  designLangaugeCustomProperties,
} from '../custom-properties';

describe('Custom properties', () => {
  it('ensures all custom properties are known', async () => {
    const [
      usedCustomProperties,
      usedCustomPropertiesDeclaration,
    ] = await getAllCustomProperties();

    const knownCustomProperties = [
      ...designLangaugeCustomProperties,
      ...nonDesignLangaugeCustomProperties,
      ...usedCustomPropertiesDeclaration,
    ];

    expect(
      usedCustomProperties.filter(
        (property) => !knownCustomProperties.includes(property),
      ),
    ).toHaveLength(0);
  });
});
