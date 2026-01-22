# =====================================================
# Liyaqa Member App - ProGuard/R8 Rules
# =====================================================
# R8 full mode is enabled by default in Android Gradle Plugin 8.0+
# These rules ensure proper code shrinking and obfuscation

# =====================================================
# General Android Rules
# =====================================================

# Keep generic signatures and annotations
-keepattributes Signature
-keepattributes *Annotation*
-keepattributes EnclosingMethod
-keepattributes InnerClasses
-keepattributes RuntimeVisibleAnnotations
-keepattributes RuntimeVisibleParameterAnnotations
-keepattributes RuntimeVisibleTypeAnnotations

# Keep line numbers for crash reporting
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep enum classes
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Keep Parcelable implementations
-keepclassmembers class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator CREATOR;
}

# =====================================================
# Kotlin Specific Rules
# =====================================================

# Keep Kotlin Metadata
-keep class kotlin.Metadata { *; }

# Keep Kotlin coroutines
-keepclassmembers class kotlinx.coroutines.** {
    volatile <fields>;
}
-keepclassmembernames class kotlinx.** {
    volatile <fields>;
}

# Keep kotlin.Result for coroutines
-keep class kotlin.Result { *; }

# Keep Kotlin reflection
-dontwarn kotlin.reflect.jvm.internal.**
-keep class kotlin.reflect.jvm.internal.** { *; }

# =====================================================
# Kotlinx Serialization Rules
# =====================================================

# Keep serialization classes
-keepattributes RuntimeVisibleAnnotations,RuntimeVisibleParameterAnnotations

# Keep @Serializable and @Serializer classes
-if @kotlinx.serialization.Serializable class **
-keepclassmembers class <1> {
    static <1>$Companion Companion;
}

# Keep `serializer()` on companion objects
-if @kotlinx.serialization.Serializable class ** {
    static **$* *;
}
-keepclassmembers class <2>$<3> {
    kotlinx.serialization.KSerializer serializer(...);
}

# Keep `INSTANCE.serializer()` for object classes
-if @kotlinx.serialization.Serializable class ** {
    public static ** INSTANCE;
}
-keepclassmembers class <1> {
    public static <1> INSTANCE;
    kotlinx.serialization.KSerializer serializer(...);
}

# Keep all @Serializable classes in our package
-keep,includedescriptorclasses class com.liyaqa.member.**$$serializer { *; }
-keepclassmembers class com.liyaqa.member.** {
    *** Companion;
}
-keepclasseswithmembers class com.liyaqa.member.** {
    kotlinx.serialization.KSerializer serializer(...);
}

# Keep serialization core classes
-keep class kotlinx.serialization.** { *; }
-dontwarn kotlinx.serialization.**

# =====================================================
# Ktor Rules
# =====================================================

# Keep Ktor classes
-keep class io.ktor.** { *; }
-keepclassmembers class io.ktor.** { *; }
-dontwarn io.ktor.**

# Ktor uses Java's ServiceLoader
-keepnames class io.ktor.client.engine.HttpClientEngineContainer
-keepnames class io.ktor.serialization.kotlinx.json.KotlinxSerializationJsonExtensionProvider

# Keep Ktor engines
-keep class io.ktor.client.engine.okhttp.** { *; }
-keep class io.ktor.client.engine.cio.** { *; }

# Ktor websocket (if used)
-keep class io.ktor.websocket.** { *; }

# =====================================================
# OkHttp Rules
# =====================================================

-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }
-keep class okio.** { *; }

# OkHttp platform adapters
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**

# =====================================================
# Koin Dependency Injection Rules
# =====================================================

# Keep Koin classes
-keep class org.koin.** { *; }
-keepclassmembers class * {
    @org.koin.core.annotation.* <methods>;
}

# Keep Koin module definitions
-keep class * extends org.koin.core.module.Module { *; }

# =====================================================
# Compose Multiplatform Rules
# =====================================================

# Keep Compose classes
-keep class androidx.compose.** { *; }
-dontwarn androidx.compose.**

# Keep Compose runtime
-keep class androidx.compose.runtime.** { *; }

# Keep Compose UI
-keepclassmembers class androidx.compose.ui.** {
    public <methods>;
}

# Keep Composable functions
-keepclassmembers class * {
    @androidx.compose.runtime.Composable <methods>;
}

# =====================================================
# Voyager Navigation Rules
# =====================================================

-keep class cafe.adriel.voyager.** { *; }
-keepclassmembers class * implements cafe.adriel.voyager.core.screen.Screen {
    <init>(...);
}

# =====================================================
# Coil Image Loading Rules
# =====================================================

-keep class coil3.** { *; }
-dontwarn coil3.**

# =====================================================
# DataStore Rules
# =====================================================

-keep class androidx.datastore.** { *; }
-keepclassmembers class * extends androidx.datastore.preferences.protobuf.GeneratedMessageLite {
    <fields>;
}

# =====================================================
# Lifecycle / ViewModel Rules
# =====================================================

-keep class androidx.lifecycle.** { *; }
-keep class * extends androidx.lifecycle.ViewModel { *; }
-keep class * extends androidx.lifecycle.AndroidViewModel { *; }

# =====================================================
# App-Specific Rules
# =====================================================

# Keep all domain models
-keep class com.liyaqa.member.domain.model.** { *; }

# Keep all DTOs
-keep class com.liyaqa.member.data.dto.** { *; }

# Keep ViewModels
-keep class com.liyaqa.member.presentation.** { *; }
-keep class * extends com.liyaqa.member.presentation.base.MviViewModel { *; }

# Keep repository interfaces
-keep interface com.liyaqa.member.domain.repository.** { *; }

# Keep navigation screens
-keep class * implements cafe.adriel.voyager.core.screen.Screen { *; }
-keep class * implements cafe.adriel.voyager.navigator.tab.Tab { *; }

# =====================================================
# Security Rules
# =====================================================

# Keep encrypted shared preferences
-keep class androidx.security.crypto.** { *; }

# =====================================================
# Debugging - Remove for Production
# =====================================================

# Uncomment for debugging shrinking issues
#-printseeds seeds.txt
#-printusage unused.txt
#-printmapping mapping.txt

# =====================================================
# Optimization Flags
# =====================================================

# Don't optimize public API (for library projects)
-dontoptimize

# Allow access modification for better optimization
-allowaccessmodification

# Remove logging in release builds
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int d(...);
    public static int i(...);
}

# Remove Kotlin assertions in release
-assumenosideeffects class kotlin.jvm.internal.Intrinsics {
    public static void checkNotNull(...);
    public static void checkExpressionValueIsNotNull(...);
    public static void checkNotNullExpressionValue(...);
    public static void checkParameterIsNotNull(...);
    public static void checkNotNullParameter(...);
    public static void checkReturnedValueIsNotNull(...);
    public static void checkFieldIsNotNull(...);
    public static void throwUninitializedPropertyAccessException(...);
    public static void throwNpe(...);
    public static void throwJavaNpe(...);
    public static void throwAssert(...);
    public static void throwIllegalArgument(...);
    public static void throwIllegalState(...);
}
