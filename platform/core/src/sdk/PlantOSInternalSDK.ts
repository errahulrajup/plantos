import { IPlantOSInternalSDK, IAssetSDK, IMESBaseSDK } from '../contracts';

export class PlantOSInternalSDK implements IPlantOSInternalSDK {
  constructor(
    public readonly asset: IAssetSDK,
    public readonly mes: IMESBaseSDK
  ) {}
}
