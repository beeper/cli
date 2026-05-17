// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../../../../core/resource';
import { APIPromise } from '../../../../core/api-promise';
import { RequestOptions } from '../../../../internal/request-options';

/**
 * First-party sign-in and encrypted messaging setup for Beeper Desktop and Beeper Server.
 */
export class BaseReset extends APIResource {
  static override readonly _key: readonly ['app', 'setup', 'recoveryKey', 'reset'] = Object.freeze([
    'app',
    'setup',
    'recoveryKey',
    'reset',
  ] as const);

  /**
   * Create a new recovery key when the user cannot use the existing one.
   */
  create(
    body: ResetCreateParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<ResetCreateResponse> {
    return this._client.post('/v1/app/setup/verification/recovery-key/reset', { body, ...options });
  }

  /**
   * Confirm that the new recovery key should be used for this account.
   */
  confirm(body: ResetConfirmParams, options?: RequestOptions): APIPromise<ResetConfirmResponse> {
    return this._client.post('/v1/app/setup/verification/recovery-key/reset/confirm', { body, ...options });
  }
}
/**
 * First-party sign-in and encrypted messaging setup for Beeper Desktop and Beeper Server.
 */
export class Reset extends BaseReset {}

export interface ResetCreateResponse {
  /**
   * New recovery key. Show it once and ask the user to save it.
   */
  recoveryKey: string;

  /**
   * Current app sign-in and encrypted messaging setup state after creating the new
   * recovery key.
   */
  session: ResetCreateResponse.Session;
}

export namespace ResetCreateResponse {
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

export interface ResetConfirmResponse {
  /**
   * Current app sign-in and encrypted messaging setup state.
   */
  session: ResetConfirmResponse.Session;
}

export namespace ResetConfirmResponse {
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

export interface ResetCreateParams {
  /**
   * Existing recovery key, if the user has it.
   */
  existingRecoveryKey?: string;
}

export interface ResetConfirmParams {
  /**
   * New recovery key returned by the reset step.
   */
  recoveryKey: string;
}

export declare namespace Reset {
  export {
    type ResetCreateResponse as ResetCreateResponse,
    type ResetConfirmResponse as ResetConfirmResponse,
    type ResetCreateParams as ResetCreateParams,
    type ResetConfirmParams as ResetConfirmParams,
  };
}
