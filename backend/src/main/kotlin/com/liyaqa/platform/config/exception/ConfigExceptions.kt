package com.liyaqa.platform.config.exception

import com.liyaqa.platform.exception.*
import java.util.UUID

class SettingNotFoundException(key: String) :
    PlatformResourceNotFoundException(PlatformErrorCode.SETTING_NOT_FOUND, "Setting not found: $key")

class SettingNotEditableException(key: String) :
    PlatformInvalidStateException(PlatformErrorCode.SETTING_NOT_EDITABLE, "Setting is not editable: $key")

class SettingValueTypeMismatchException(key: String, expectedType: String, actualValue: String) :
    PlatformInvalidStateException(PlatformErrorCode.SETTING_TYPE_MISMATCH, "Setting '$key' expects type $expectedType but got value: $actualValue")

class MaintenanceWindowNotFoundException(id: UUID) :
    PlatformResourceNotFoundException(PlatformErrorCode.MAINTENANCE_WINDOW_NOT_FOUND, "Maintenance window not found: $id")
