// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../../../core/resource';
import * as RecoveryKeyAPI from './recovery-key/recovery-key';
import {
  BaseRecoveryKey,
  RecoveryKey,
  RecoveryKeyVerifyParams,
  RecoveryKeyVerifyResponse,
} from './recovery-key/recovery-key';
import * as VerificationsAPI from './verifications/verifications';
import {
  BaseVerifications,
  VerificationAcceptResponse,
  VerificationCancelParams,
  VerificationCancelResponse,
  VerificationCreateParams,
  VerificationCreateResponse,
  VerificationListResponse,
  VerificationRetrieveResponse,
  Verifications,
} from './verifications/verifications';
import { APIPromise } from '../../../core/api-promise';
import { buildHeaders } from '../../../internal/headers';
import { RequestOptions } from '../../../internal/request-options';

/**
 * Complete first-party Beeper app setup
 */
export class BaseSetup extends APIResource {
  static override readonly _key: readonly ['app', 'setup'] = Object.freeze(['app', 'setup'] as const);

  /**
   * Return the current Beeper Desktop or Beeper Server sign-in and encrypted
   * messaging setup state. This endpoint is public before sign-in so apps can
   * discover that sign-in is needed; after sign-in, pass a read token.
   */
  retrieve(options?: RequestOptions): APIPromise<SetupRetrieveResponse> {
    return this._client.get('/v1/app/setup', options);
  }

  /**
   * Send a sign-in code to the user email address for app setup.
   */
  email(body: SetupEmailParams, options?: RequestOptions): APIPromise<void> {
    return this._client.post('/v1/app/setup/email', {
      body,
      ...options,
      headers: buildHeaders([{ Accept: '*/*' }, options?.headers]),
      __security: {},
    });
  }

  /**
   * Create a Beeper account after the user chooses a username and accepts the Terms
   * of Use.
   */
  register(body: SetupRegisterParams, options?: RequestOptions): APIPromise<SetupRegisterResponse> {
    return this._client.post('/v1/app/setup/register', { body, ...options, __security: {} });
  }

  /**
   * Finish setup sign-in with the code sent to the user email address. If the user
   * needs a new account, the response includes account creation copy and username
   * suggestions.
   */
  response(body: SetupResponseParams, options?: RequestOptions): APIPromise<SetupResponseResponse> {
    return this._client.post('/v1/app/setup/response', { body, ...options, __security: {} });
  }

  /**
   * Start setting up Beeper Desktop or Beeper Server. The flow supports existing
   * Beeper accounts and new account creation.
   */
  start(options?: RequestOptions): APIPromise<SetupStartResponse> {
    return this._client.post('/v1/app/setup/start', { ...options, __security: {} });
  }
}
/**
 * Complete first-party Beeper app setup
 */
export class Setup extends BaseSetup {
  recoveryKey: RecoveryKeyAPI.RecoveryKey = new RecoveryKeyAPI.RecoveryKey(this._client);
  verifications: VerificationsAPI.Verifications = new VerificationsAPI.Verifications(this._client);
}

export interface SetupRetrieveResponse {
  /**
   * Encrypted messaging setup status.
   */
  e2ee: SetupRetrieveResponse.E2EE;

  /**
   * Current sign-in and encrypted messaging setup state for Beeper Desktop or Beeper
   * Server.
   */
  state:
    | 'needs-login'
    | 'initializing'
    | 'needs-cross-signing-setup'
    | 'needs-verification'
    | 'needs-secrets'
    | 'needs-first-sync'
    | 'ready';

  /**
   * Signed-in account details. Omitted until sign-in is complete.
   */
  matrix?: SetupRetrieveResponse.Matrix;

  /**
   * Trusted device verification progress.
   */
  verification?: SetupRetrieveResponse.Verification;
}

export namespace SetupRetrieveResponse {
  /**
   * Encrypted messaging setup status.
   */
  export interface E2EE {
    /**
     * Whether this account can verify trusted devices.
     */
    crossSigning: boolean;

    /**
     * Whether the first encrypted message sync is complete.
     */
    firstSyncDone: boolean;

    /**
     * Whether the user confirmed that they saved their recovery key.
     */
    hasBackedUpRecoveryKey: boolean;

    /**
     * Whether encrypted messaging setup has started.
     */
    initialized: boolean;

    /**
     * Whether encrypted message backup is available.
     */
    keyBackup: boolean;

    /**
     * Encrypted messaging keys available on this device.
     */
    secrets: E2EE.Secrets;

    /**
     * Whether secure key storage is available.
     */
    secretStorage: boolean;

    /**
     * Whether this device is trusted for encrypted messages.
     */
    verified: boolean;

    /**
     * Unix timestamp for when the recovery key was created.
     */
    recoveryKeyGeneratedAt?: number;
  }

  export namespace E2EE {
    /**
     * Encrypted messaging keys available on this device.
     */
    export interface Secrets {
      /**
       * Whether the account identity key is available.
       */
      masterKey: boolean;

      /**
       * Whether the encrypted message backup key is available.
       */
      megolmBackupKey: boolean;

      /**
       * Whether a recovery key is available.
       */
      recoveryKey: boolean;

      /**
       * Whether the device trust key is available.
       */
      selfSigningKey: boolean;

      /**
       * Whether the user trust key is available.
       */
      userSigningKey: boolean;
    }
  }

  /**
   * Signed-in account details. Omitted until sign-in is complete.
   */
  export interface Matrix {
    /**
     * Current device ID.
     */
    deviceID: string;

    /**
     * Beeper homeserver URL for this account.
     */
    homeserver: string;

    /**
     * Signed-in Beeper user ID.
     */
    userID: string;
  }

  /**
   * Trusted device verification progress.
   */
  export interface Verification {
    /**
     * Verification ID to pass in verification action paths.
     */
    id: string;

    /**
     * Verification actions that are valid for the current state.
     */
    availableActions: Array<'accept' | 'cancel' | 'qr.confirmScanned' | 'sas.start' | 'sas.confirm'>;

    /**
     * Whether this device started or received the verification.
     */
    direction: 'incoming' | 'outgoing';

    /**
     * Verification methods supported for this transaction.
     */
    methods: Array<'qr' | 'sas'>;

    /**
     * Why this verification exists.
     */
    purpose: 'login' | 'device';

    /**
     * Current trusted-device verification state.
     */
    state: 'requested' | 'ready' | 'sas_ready' | 'qr_scanned' | 'done' | 'cancelled' | 'error';

    /**
     * Verification error details, if verification stopped.
     */
    error?: Verification.Error;

    /**
     * Other device participating in verification.
     */
    otherDevice?: Verification.OtherDevice;

    /**
     * Other Beeper user participating in verification.
     */
    otherUserID?: string;

    /**
     * QR verification data.
     */
    qr?: Verification.QR;

    /**
     * Emoji or number comparison data for verification.
     */
    sas?: Verification.SAS;
  }

  export namespace Verification {
    /**
     * Verification error details, if verification stopped.
     */
    export interface Error {
      /**
       * Verification error code.
       */
      code: string;

      /**
       * User-facing verification error message.
       */
      reason: string;
    }

    /**
     * Other device participating in verification.
     */
    export interface OtherDevice {
      /**
       * Other device ID.
       */
      id: string;

      /**
       * Other device display name, if known.
       */
      name?: string;
    }

    /**
     * QR verification data.
     */
    export interface QR {
      /**
       * QR code payload to display for verification.
       */
      data: string;
    }

    /**
     * Emoji or number comparison data for verification.
     */
    export interface SAS {
      /**
       * Emoji sequence to compare on both devices.
       */
      emojis: string;

      /**
       * Number sequence to compare on both devices.
       */
      decimals?: string;
    }
  }
}

export interface SetupRegisterResponse {
  /**
   * Account credentials for first-party app setup.
   */
  matrix: SetupRegisterResponse.Matrix;

  /**
   * Current app sign-in and encrypted messaging setup state after sign-in.
   */
  session: SetupRegisterResponse.Session;
}

export namespace SetupRegisterResponse {
  /**
   * Account credentials for first-party app setup.
   */
  export interface Matrix {
    /**
     * Beeper account access token. Returned once for first-party app setup.
     */
    accessToken: string;

    /**
     * Current device ID.
     */
    deviceID: string;

    /**
     * Beeper homeserver URL for this account.
     */
    homeserver: string;

    /**
     * Signed-in Beeper user ID.
     */
    userID: string;
  }

  /**
   * Current app sign-in and encrypted messaging setup state after sign-in.
   */
  export interface Session {
    /**
     * Encrypted messaging setup status.
     */
    e2ee: Session.E2EE;

    /**
     * Current sign-in and encrypted messaging setup state for Beeper Desktop or Beeper
     * Server.
     */
    state:
      | 'needs-login'
      | 'initializing'
      | 'needs-cross-signing-setup'
      | 'needs-verification'
      | 'needs-secrets'
      | 'needs-first-sync'
      | 'ready';

    /**
     * Signed-in account details. Omitted until sign-in is complete.
     */
    matrix?: Session.Matrix;

    /**
     * Trusted device verification progress.
     */
    verification?: Session.Verification;
  }

  export namespace Session {
    /**
     * Encrypted messaging setup status.
     */
    export interface E2EE {
      /**
       * Whether this account can verify trusted devices.
       */
      crossSigning: boolean;

      /**
       * Whether the first encrypted message sync is complete.
       */
      firstSyncDone: boolean;

      /**
       * Whether the user confirmed that they saved their recovery key.
       */
      hasBackedUpRecoveryKey: boolean;

      /**
       * Whether encrypted messaging setup has started.
       */
      initialized: boolean;

      /**
       * Whether encrypted message backup is available.
       */
      keyBackup: boolean;

      /**
       * Encrypted messaging keys available on this device.
       */
      secrets: E2EE.Secrets;

      /**
       * Whether secure key storage is available.
       */
      secretStorage: boolean;

      /**
       * Whether this device is trusted for encrypted messages.
       */
      verified: boolean;

      /**
       * Unix timestamp for when the recovery key was created.
       */
      recoveryKeyGeneratedAt?: number;
    }

    export namespace E2EE {
      /**
       * Encrypted messaging keys available on this device.
       */
      export interface Secrets {
        /**
         * Whether the account identity key is available.
         */
        masterKey: boolean;

        /**
         * Whether the encrypted message backup key is available.
         */
        megolmBackupKey: boolean;

        /**
         * Whether a recovery key is available.
         */
        recoveryKey: boolean;

        /**
         * Whether the device trust key is available.
         */
        selfSigningKey: boolean;

        /**
         * Whether the user trust key is available.
         */
        userSigningKey: boolean;
      }
    }

    /**
     * Signed-in account details. Omitted until sign-in is complete.
     */
    export interface Matrix {
      /**
       * Current device ID.
       */
      deviceID: string;

      /**
       * Beeper homeserver URL for this account.
       */
      homeserver: string;

      /**
       * Signed-in Beeper user ID.
       */
      userID: string;
    }

    /**
     * Trusted device verification progress.
     */
    export interface Verification {
      /**
       * Verification ID to pass in verification action paths.
       */
      id: string;

      /**
       * Verification actions that are valid for the current state.
       */
      availableActions: Array<'accept' | 'cancel' | 'qr.confirmScanned' | 'sas.start' | 'sas.confirm'>;

      /**
       * Whether this device started or received the verification.
       */
      direction: 'incoming' | 'outgoing';

      /**
       * Verification methods supported for this transaction.
       */
      methods: Array<'qr' | 'sas'>;

      /**
       * Why this verification exists.
       */
      purpose: 'login' | 'device';

      /**
       * Current trusted-device verification state.
       */
      state: 'requested' | 'ready' | 'sas_ready' | 'qr_scanned' | 'done' | 'cancelled' | 'error';

      /**
       * Verification error details, if verification stopped.
       */
      error?: Verification.Error;

      /**
       * Other device participating in verification.
       */
      otherDevice?: Verification.OtherDevice;

      /**
       * Other Beeper user participating in verification.
       */
      otherUserID?: string;

      /**
       * QR verification data.
       */
      qr?: Verification.QR;

      /**
       * Emoji or number comparison data for verification.
       */
      sas?: Verification.SAS;
    }

    export namespace Verification {
      /**
       * Verification error details, if verification stopped.
       */
      export interface Error {
        /**
         * Verification error code.
         */
        code: string;

        /**
         * User-facing verification error message.
         */
        reason: string;
      }

      /**
       * Other device participating in verification.
       */
      export interface OtherDevice {
        /**
         * Other device ID.
         */
        id: string;

        /**
         * Other device display name, if known.
         */
        name?: string;
      }

      /**
       * QR verification data.
       */
      export interface QR {
        /**
         * QR code payload to display for verification.
         */
        data: string;
      }

      /**
       * Emoji or number comparison data for verification.
       */
      export interface SAS {
        /**
         * Emoji sequence to compare on both devices.
         */
        emojis: string;

        /**
         * Number sequence to compare on both devices.
         */
        decimals?: string;
      }
    }
  }
}

export type SetupResponseResponse =
  | SetupResponseResponse.Success
  | SetupResponseResponse.RegistrationRequired;

export namespace SetupResponseResponse {
  export interface Success {
    /**
     * Account credentials for first-party app setup.
     */
    matrix: Success.Matrix;

    /**
     * Current app sign-in and encrypted messaging setup state after sign-in.
     */
    session: Success.Session;
  }

  export namespace Success {
    /**
     * Account credentials for first-party app setup.
     */
    export interface Matrix {
      /**
       * Beeper account access token. Returned once for first-party app setup.
       */
      accessToken: string;

      /**
       * Current device ID.
       */
      deviceID: string;

      /**
       * Beeper homeserver URL for this account.
       */
      homeserver: string;

      /**
       * Signed-in Beeper user ID.
       */
      userID: string;
    }

    /**
     * Current app sign-in and encrypted messaging setup state after sign-in.
     */
    export interface Session {
      /**
       * Encrypted messaging setup status.
       */
      e2ee: Session.E2EE;

      /**
       * Current sign-in and encrypted messaging setup state for Beeper Desktop or Beeper
       * Server.
       */
      state:
        | 'needs-login'
        | 'initializing'
        | 'needs-cross-signing-setup'
        | 'needs-verification'
        | 'needs-secrets'
        | 'needs-first-sync'
        | 'ready';

      /**
       * Signed-in account details. Omitted until sign-in is complete.
       */
      matrix?: Session.Matrix;

      /**
       * Trusted device verification progress.
       */
      verification?: Session.Verification;
    }

    export namespace Session {
      /**
       * Encrypted messaging setup status.
       */
      export interface E2EE {
        /**
         * Whether this account can verify trusted devices.
         */
        crossSigning: boolean;

        /**
         * Whether the first encrypted message sync is complete.
         */
        firstSyncDone: boolean;

        /**
         * Whether the user confirmed that they saved their recovery key.
         */
        hasBackedUpRecoveryKey: boolean;

        /**
         * Whether encrypted messaging setup has started.
         */
        initialized: boolean;

        /**
         * Whether encrypted message backup is available.
         */
        keyBackup: boolean;

        /**
         * Encrypted messaging keys available on this device.
         */
        secrets: E2EE.Secrets;

        /**
         * Whether secure key storage is available.
         */
        secretStorage: boolean;

        /**
         * Whether this device is trusted for encrypted messages.
         */
        verified: boolean;

        /**
         * Unix timestamp for when the recovery key was created.
         */
        recoveryKeyGeneratedAt?: number;
      }

      export namespace E2EE {
        /**
         * Encrypted messaging keys available on this device.
         */
        export interface Secrets {
          /**
           * Whether the account identity key is available.
           */
          masterKey: boolean;

          /**
           * Whether the encrypted message backup key is available.
           */
          megolmBackupKey: boolean;

          /**
           * Whether a recovery key is available.
           */
          recoveryKey: boolean;

          /**
           * Whether the device trust key is available.
           */
          selfSigningKey: boolean;

          /**
           * Whether the user trust key is available.
           */
          userSigningKey: boolean;
        }
      }

      /**
       * Signed-in account details. Omitted until sign-in is complete.
       */
      export interface Matrix {
        /**
         * Current device ID.
         */
        deviceID: string;

        /**
         * Beeper homeserver URL for this account.
         */
        homeserver: string;

        /**
         * Signed-in Beeper user ID.
         */
        userID: string;
      }

      /**
       * Trusted device verification progress.
       */
      export interface Verification {
        /**
         * Verification ID to pass in verification action paths.
         */
        id: string;

        /**
         * Verification actions that are valid for the current state.
         */
        availableActions: Array<'accept' | 'cancel' | 'qr.confirmScanned' | 'sas.start' | 'sas.confirm'>;

        /**
         * Whether this device started or received the verification.
         */
        direction: 'incoming' | 'outgoing';

        /**
         * Verification methods supported for this transaction.
         */
        methods: Array<'qr' | 'sas'>;

        /**
         * Why this verification exists.
         */
        purpose: 'login' | 'device';

        /**
         * Current trusted-device verification state.
         */
        state: 'requested' | 'ready' | 'sas_ready' | 'qr_scanned' | 'done' | 'cancelled' | 'error';

        /**
         * Verification error details, if verification stopped.
         */
        error?: Verification.Error;

        /**
         * Other device participating in verification.
         */
        otherDevice?: Verification.OtherDevice;

        /**
         * Other Beeper user participating in verification.
         */
        otherUserID?: string;

        /**
         * QR verification data.
         */
        qr?: Verification.QR;

        /**
         * Emoji or number comparison data for verification.
         */
        sas?: Verification.SAS;
      }

      export namespace Verification {
        /**
         * Verification error details, if verification stopped.
         */
        export interface Error {
          /**
           * Verification error code.
           */
          code: string;

          /**
           * User-facing verification error message.
           */
          reason: string;
        }

        /**
         * Other device participating in verification.
         */
        export interface OtherDevice {
          /**
           * Other device ID.
           */
          id: string;

          /**
           * Other device display name, if known.
           */
          name?: string;
        }

        /**
         * QR verification data.
         */
        export interface QR {
          /**
           * QR code payload to display for verification.
           */
          data: string;
        }

        /**
         * Emoji or number comparison data for verification.
         */
        export interface SAS {
          /**
           * Emoji sequence to compare on both devices.
           */
          emojis: string;

          /**
           * Number sequence to compare on both devices.
           */
          decimals?: string;
        }
      }
    }
  }

  export interface RegistrationRequired {
    /**
     * Copy to display during account creation.
     */
    copy: RegistrationRequired.Copy;

    /**
     * Registration token returned by Beeper.
     */
    leadToken: string;

    /**
     * Indicates that the user needs to create a Beeper account.
     */
    registrationRequired: true;

    /**
     * Setup request ID to use when creating the account.
     */
    setupRequestID: string;

    /**
     * Suggested usernames for the new account.
     */
    usernameSuggestions?: Array<string>;
  }

  export namespace RegistrationRequired {
    /**
     * Copy to display during account creation.
     */
    export interface Copy {
      /**
       * Submit button label.
       */
      submit: 'Continue';

      /**
       * Terms and privacy notice to show before account creation.
       */
      terms: 'By continuing, you agree to the Terms of Use and acknowledge the Privacy Policy.';

      /**
       * Title for the username step.
       */
      title: 'Choose your username';

      /**
       * Placeholder for the username field.
       */
      usernamePlaceholder: 'Username';
    }
  }
}

export interface SetupStartResponse {
  /**
   * Setup request ID to use in the next sign-in step.
   */
  setupRequestID: string;

  /**
   * Available sign-in methods for this setup request.
   */
  signInMethods: Array<string>;
}

export interface SetupEmailParams {
  /**
   * Email address to send the sign-in code to.
   */
  email: string;

  /**
   * Setup request ID returned by the start step.
   */
  setupRequestID: string;
}

export interface SetupRegisterParams {
  /**
   * Confirms that the user accepted the Terms of Use and acknowledged the Privacy
   * Policy.
   */
  acceptTerms: true;

  /**
   * Registration token returned by Beeper.
   */
  leadToken: string;

  /**
   * Setup request ID returned by the start step.
   */
  setupRequestID: string;

  /**
   * Username selected by the user.
   */
  username: string;
}

export interface SetupResponseParams {
  /**
   * Sign-in code from the user email.
   */
  response: string;

  /**
   * Setup request ID returned by the start step.
   */
  setupRequestID: string;
}

Setup.RecoveryKey = RecoveryKey;
Setup.BaseRecoveryKey = BaseRecoveryKey;
Setup.Verifications = Verifications;
Setup.BaseVerifications = BaseVerifications;

export declare namespace Setup {
  export {
    type SetupRetrieveResponse as SetupRetrieveResponse,
    type SetupRegisterResponse as SetupRegisterResponse,
    type SetupResponseResponse as SetupResponseResponse,
    type SetupStartResponse as SetupStartResponse,
    type SetupEmailParams as SetupEmailParams,
    type SetupRegisterParams as SetupRegisterParams,
    type SetupResponseParams as SetupResponseParams,
  };

  export {
    RecoveryKey as RecoveryKey,
    BaseRecoveryKey as BaseRecoveryKey,
    type RecoveryKeyVerifyResponse as RecoveryKeyVerifyResponse,
    type RecoveryKeyVerifyParams as RecoveryKeyVerifyParams,
  };

  export {
    Verifications as Verifications,
    BaseVerifications as BaseVerifications,
    type VerificationCreateResponse as VerificationCreateResponse,
    type VerificationRetrieveResponse as VerificationRetrieveResponse,
    type VerificationListResponse as VerificationListResponse,
    type VerificationAcceptResponse as VerificationAcceptResponse,
    type VerificationCancelResponse as VerificationCancelResponse,
    type VerificationCreateParams as VerificationCreateParams,
    type VerificationCancelParams as VerificationCancelParams,
  };
}
