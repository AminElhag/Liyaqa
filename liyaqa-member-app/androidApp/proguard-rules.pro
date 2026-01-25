# Liyaqa Member App ProGuard Rules

# Kotlin Serialization
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.AnnotationsKt
-keepclassmembers class kotlinx.serialization.json.** {
    *** Companion;
}
-keepclasseswithmembers class kotlinx.serialization.json.** {
    kotlinx.serialization.KSerializer serializer(...);
}
-keep,includedescriptorclasses class com.liyaqa.member.**$$serializer { *; }
-keepclassmembers class com.liyaqa.member.** {
    *** Companion;
}
-keepclasseswithmembers class com.liyaqa.member.** {
    kotlinx.serialization.KSerializer serializer(...);
}

# Ktor
-keep class io.ktor.** { *; }
-keep class kotlinx.coroutines.** { *; }
-dontwarn kotlinx.atomicfu.**
-dontwarn io.netty.**
-dontwarn com.typesafe.**
-dontwarn org.slf4j.**

# SQLDelight
-keep class com.liyaqa.member.data.local.** { *; }

# Koin
-keepnames class com.liyaqa.member.di.** { *; }

# Voyager
-keep class cafe.adriel.voyager.** { *; }

# Compose
-keep class androidx.compose.** { *; }
-dontwarn androidx.compose.**

# ZXing QR
-keep class com.google.zxing.** { *; }

# Firebase
-keep class com.google.firebase.** { *; }
-keepattributes Signature
-keepattributes *Annotation*

# Keep data classes
-keep class com.liyaqa.member.domain.model.** { *; }
-keep class com.liyaqa.member.data.remote.dto.** { *; }

# General Android
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
