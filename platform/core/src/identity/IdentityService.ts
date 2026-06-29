import { v4 as uuidv4 } from 'uuid';
import { UUID, AssetTag, BusinessCode } from '../types';

export interface PlantOSIdentity {
  uuid: UUID;
  assetTag?: AssetTag;
  businessCode?: BusinessCode;
}

export class IdentityService {
  /**
   * Generates a universally unique identifier (UUID v4)
   */
  public generateUUID(): UUID {
    return uuidv4();
  }

  /**
   * Generates a fully qualified asset identity
   */
  public createAssetIdentity(tag: AssetTag, businessCode: BusinessCode): PlantOSIdentity {
    return {
      uuid: this.generateUUID(),
      assetTag: tag,
      businessCode: businessCode
    };
  }
}
