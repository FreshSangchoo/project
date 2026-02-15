plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    kotlin("kapt")
    alias(libs.plugins.hilt)
    kotlin("plugin.serialization") version "1.9.22"
}

android {
    namespace = "com.audiguard"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.audiguard"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }

    kotlinOptions {
        jvmTarget = "1.8"
    }

    buildFeatures {
        viewBinding = true
        compose = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = libs.versions.compose.compiler.get()
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
            excludes += "META-INF/INDEX.LIST"
            excludes += "META-INF/DEPENDENCIES"
        }
    }
}

dependencies {
    // SSE
    implementation("com.launchdarkly:okhttp-eventsource:4.1.0")

    // 워치 연동 설정
    implementation("com.google.android.gms:play-services-wearable:18.0.0")
    implementation("androidx.wear:wear:1.2.0")

    // 머티리얼 디자인
    implementation("com.google.android.material:material:1.11.0")
    implementation(libs.androidx.foundation.android)

    // Room
    implementation(libs.androidx.room.runtime)
    implementation(libs.androidx.room.ktx)
    implementation(libs.digital.ink.recognition)
    kapt(libs.androidx.room.compiler)

    // Lottie
    implementation("com.airbnb.android:lottie:5.0.3")

    // AndroidX & Material
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.appcompat)
    implementation(libs.material)
    implementation(libs.androidx.activity)
    implementation(libs.androidx.constraintlayout)

    // Testing
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)

    // TensorFlow & Others
    implementation("org.tensorflow:tensorflow-lite:2.5.0")
    implementation("org.tensorflow:tensorflow-lite-support:0.3.0")
    implementation("org.tensorflow:tensorflow-lite-metadata:0.3.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.6.4")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.6.1")

    // Compose
    val composeBom = platform(libs.androidx.compose.bom)
    implementation(composeBom)
    androidTestImplementation(composeBom)

    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)
    debugImplementation(libs.androidx.compose.ui.tooling)
    debugImplementation(libs.androidx.compose.ui.test.manifest)

    // Activity Compose
    implementation(libs.androidx.activity.compose)  // 수정됨

    // Lifecycle
    implementation(libs.androidx.lifecycle.runtime.compose)  // 수정됨
    implementation(libs.androidx.lifecycle.viewmodel.compose)  // 수정됨

    // Hilt
    implementation(libs.hilt.android)
    kapt(libs.hilt.compiler)
    implementation(libs.hilt.navigation.compose)

    // Coil
    implementation(libs.coil.compose)    //Retrofit
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")

    // OkHttp 라이브러리 추가
    implementation("com.squareup.okhttp3:okhttp:4.9.3")
    // HttpLoggingInterceptor 추가
    implementation("com.squareup.okhttp3:logging-interceptor:4.9.3")
    // 코루틴 관련
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.6.4")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.6.4")

    implementation("com.google.android.material:material:1.4.0-alpha01")

    implementation(libs.coil.compose)

    // Google Cloud Speech API 관련 의존성
    implementation("com.google.cloud:google-cloud-speech:2.5.1")
    implementation("com.google.auth:google-auth-library-oauth2-http:1.11.0")

    // gRPC 의존성 추가
    implementation("io.grpc:grpc-okhttp:1.53.0")
    implementation("io.grpc:grpc-protobuf:1.53.0")
    implementation("io.grpc:grpc-stub:1.53.0")

    // Android용 gRPC 의존성
    implementation("io.grpc:grpc-android:1.53.0")

    // rabbitMQ
    implementation("com.rabbitmq:amqp-client:5.14.2")

    // gson
    implementation("com.google.code.gson:gson:2.8.9")

    // logging
    implementation("ch.qos.logback:logback-classic:1.2.11")

    // Kotlin Serialization
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.2")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-play-services:1.7.3")


    //flexbox
    implementation("com.google.android.flexbox:flexbox:3.0.0")

    //애니메이션
    implementation("com.daimajia.androidanimations:library:2.4@aar")

    // 테스트 관련 의존성
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.ui.test.junit4)
    debugImplementation(libs.androidx.ui.tooling)
    debugImplementation(libs.androidx.ui.test.manifest)
}