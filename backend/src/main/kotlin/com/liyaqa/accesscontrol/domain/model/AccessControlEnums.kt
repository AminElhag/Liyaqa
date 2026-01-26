package com.liyaqa.accesscontrol.domain.model

enum class DeviceType {
    TURNSTILE,
    SPEED_GATE,
    BIOMETRIC_TERMINAL,
    RFID_READER,
    QR_SCANNER
}

enum class DeviceManufacturer {
    GUNNEBO,
    SUPREMA,
    HID,
    ZKTECO,
    BOON_EDAM,
    CUSTOM
}

enum class DeviceStatus {
    ACTIVE,
    INACTIVE,
    MAINTENANCE,
    OFFLINE
}

enum class DeviceDirection {
    ENTRY,
    EXIT,
    BIDIRECTIONAL
}

enum class ZoneType {
    GYM_FLOOR,
    LOCKER_ROOM,
    POOL,
    STUDIO,
    SPA,
    RESTRICTED,
    LOBBY,
    CAFE,
    KIDS_AREA
}

enum class GenderRestriction {
    MALE,
    FEMALE
}

enum class CardType {
    RFID,
    NFC,
    MIFARE,
    HID_PROX,
    HID_ICLASS
}

enum class CardStatus {
    ACTIVE,
    SUSPENDED,
    LOST,
    EXPIRED,
    REVOKED
}

enum class BiometricType {
    FINGERPRINT,
    FACE,
    PALM,
    IRIS
}

enum class FingerPosition {
    LEFT_THUMB,
    LEFT_INDEX,
    LEFT_MIDDLE,
    LEFT_RING,
    LEFT_LITTLE,
    RIGHT_THUMB,
    RIGHT_INDEX,
    RIGHT_MIDDLE,
    RIGHT_RING,
    RIGHT_LITTLE
}

enum class BiometricStatus {
    ACTIVE,
    SUSPENDED,
    NEEDS_RE_ENROLLMENT
}

enum class AccessMethod {
    RFID,
    BIOMETRIC,
    QR_CODE,
    PIN,
    MANUAL
}

enum class AccessDirection {
    ENTRY,
    EXIT
}

enum class AccessResult {
    GRANTED,
    DENIED
}

enum class DenialReason {
    EXPIRED_MEMBERSHIP,
    INVALID_CARD,
    TIME_RESTRICTED,
    ZONE_RESTRICTED,
    CAPACITY_FULL,
    UNKNOWN_CREDENTIAL,
    SUSPENDED_CARD,
    BIOMETRIC_MISMATCH,
    MAINTENANCE_MODE
}

enum class AccessRuleType {
    ALLOW,
    DENY
}
