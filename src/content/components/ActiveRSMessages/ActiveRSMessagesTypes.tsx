import { RSMessage } from "../../../server/queryUtilsTypes";

export interface CFRMessage extends RSMessage {
  content: {
    action: {
      data: {
        url: string;
      };
    };
    buttons: {
      primary: {
        action: {
          type: string;
        };
      };
    };
  };
}

export interface BucketsConfig {
  [bucketName: string]: {
    url: string;
    additionalColumns: string[];
  };
}
