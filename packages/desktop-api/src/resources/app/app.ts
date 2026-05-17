// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../../core/resource';
import * as SetupAPI from './setup/setup';
import {
  BaseSetup,
  Setup,
  SetupEmailParams,
  SetupRegisterParams,
  SetupRegisterResponse,
  SetupResponseParams,
  SetupResponseResponse,
  SetupRetrieveResponse,
  SetupStartResponse,
} from './setup/setup';

/**
 * Manage Beeper account setup and encrypted messaging setup
 */
export class BaseApp extends APIResource {
  static override readonly _key: readonly ['app'] = Object.freeze(['app'] as const);
}
/**
 * Manage Beeper account setup and encrypted messaging setup
 */
export class App extends BaseApp {
  setup: SetupAPI.Setup = new SetupAPI.Setup(this._client);
}

export interface RecoveryKeyResetResponse {
  /**
   * New recovery key. Show it once and ask the user to save it.
   */
  recoveryKey: string;

  /**
   * Current app sign-in and encrypted messaging setup state after creating the new
   * recovery key.
   */
  session: RecoveryKeyResetResponse.Session;
}

export namespace RecoveryKeyResetResponse {
  /**
   * Current app sign-in and encrypted messaging setup state after creating the new
   * recovery key.
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

export interface SetupCompleteResponse {
  /**
   * Account credentials for first-party app setup.
   */
  matrix: SetupCompleteResponse.Matrix;

  /**
   * Current app sign-in and encrypted messaging setup state after sign-in.
   */
  session: SetupCompleteResponse.Session;
}

export namespace SetupCompleteResponse {
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

export interface SetupRegistrationRequiredResponse {
  /**
   * Copy to display during account creation.
   */
  copy: SetupRegistrationRequiredResponse.Copy;

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

export namespace SetupRegistrationRequiredResponse {
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

export type SetupResponseOutput = SetupResponseOutput.Success | SetupResponseOutput.RegistrationRequired;

export namespace SetupResponseOutput {
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

export interface SetupStateResponse {
  /**
   * Current app sign-in and encrypted messaging setup state.
   */
  session: SetupStateResponse.Session;
}

export namespace SetupStateResponse {
  /**
   * Current app sign-in and encrypted messaging setup state.
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

export interface VerificationResponse {
  /**
   * Current app sign-in and encrypted messaging setup state.
   */
  session: VerificationResponse.Session;

  /**
   * Trusted device verification progress.
   */
  verification?: VerificationResponse.Verification;
}

export namespace VerificationResponse {
  /**
   * Current app sign-in and encrypted messaging setup state.
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

App.Setup = Setup;
App.BaseSetup = BaseSetup;

export declare namespace App {
  export {
    type RecoveryKeyResetResponse as RecoveryKeyResetResponse,
    type SetupCompleteResponse as SetupCompleteResponse,
    type SetupRegistrationRequiredResponse as SetupRegistrationRequiredResponse,
    type SetupResponseOutput as SetupResponseOutput,
    type SetupStateResponse as SetupStateResponse,
    type Verification as Verification,
    type VerificationResponse as VerificationResponse,
  };

  export {
    Setup as Setup,
    BaseSetup as BaseSetup,
    type SetupRetrieveResponse as SetupRetrieveResponse,
    type SetupRegisterResponse as SetupRegisterResponse,
    type SetupResponseResponse as SetupResponseResponse,
    type SetupStartResponse as SetupStartResponse,
    type SetupEmailParams as SetupEmailParams,
    type SetupRegisterParams as SetupRegisterParams,
    type SetupResponseParams as SetupResponseParams,
  };
}
