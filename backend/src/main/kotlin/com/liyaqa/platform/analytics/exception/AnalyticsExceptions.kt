package com.liyaqa.platform.analytics.exception

import com.liyaqa.platform.exception.*

class AnalyticsDataUnavailableException(metric: String) :
    PlatformInvalidStateException(PlatformErrorCode.ANALYTICS_UNAVAILABLE, "Analytics data unavailable for metric: $metric")

class UnsupportedExportFormatException(format: String) :
    PlatformInvalidStateException(PlatformErrorCode.UNSUPPORTED_EXPORT_FORMAT, "Unsupported export format: $format")
