pipeline {
    agent any

    stages {
        stage('Checkout SCM') {
            steps {
                echo 'Checking out SCM...'
                checkout scm
            }
        }
        
        // stage('Prepare SonarQube Analysis') {
        //     steps {
        //         echo 'Setting executable permissions for gradlew...'
        //         sh '''
        //             cd backend
        //             chmod +x gradlew  # gradlew 파일에 실행 권한 부여
        //         '''
        //     }
        // }

        // stage('SonarQube Analysis') {
        //     steps {
        //         echo 'Running SonarQube analysis...'
        //         withSonarQubeEnv('SonarQube'){  // SonarQube 인스턴스 이름을 사용
        //             sh '''
        //                 cd backend
        //                 ./gradlew sonar
        //             '''
        //         }
        //     }
        // }

        stage('Build JAR') {
            steps {
                echo 'Building JAR file...'
                sh '''
                    cd backend
                    chmod +x gradlew  # gradlew 파일에 실행 권한 부여
                    ./gradlew clean bootJar --no-build-cache -x test
                '''
            }
        }

        stage('Deploy with Docker Compose') {
            steps {
                echo 'Deploying with Docker Compose...'
                sh '''
                    # 새로운 이미지를 빌드하고 모든 컨테이너 실행
                    docker-compose up -d --build
                '''
            }
        }
    }

    post {
        always {
            echo 'Pipeline finished.'
        }
        success {
            echo 'Pipeline completed successfully.'
        }
        failure {
            echo 'Pipeline failed.'
        }
    }
}
pipeline {
    agent any

    environment {
        APK_OUTPUT_DIR = 'frontend/android/app/build/outputs/apk/release/'  // APK 파일 위치
        APK_FINAL_NAME = 'DONZOOM.apk'  // APK 파일 최종 이름
    }

    stages {
        stage('Checkout SCM') {
            steps {
                echo 'Checking out frontend SCM...'
                checkout scm  // Git에서 소스 코드 체크아웃
            }
        }

        stage('Install Node Modules') {
            steps {
                echo 'Installing node modules...'
                sh '''
                    cd frontend
                    npm install  # 필요한 Node 모듈 설치
                    npm install @svgr/plugin-svgo --save-dev  # 누락된 모듈 추가 설치
                '''
            }
        }

        stage('Build APK') {
            steps {
                echo 'Building APK for frontend...'
                sh '''
                    cd frontend/android
                    chmod +x gradlew  # gradlew 파일에 실행 권한 부여
                    ./gradlew assembleRelease  # APK 빌드
                '''
            }
        }

        stage('Find and Rename APK') {
            steps {
                echo 'Finding and renaming APK...'
                script {
                    def apkPath = sh(script: "find ${APK_OUTPUT_DIR} -name 'app-release.apk'", returnStdout: true).trim()
                    if (apkPath) {
                        echo "APK found at: ${apkPath}"
                        sh "mv ${apkPath} ${APK_OUTPUT_DIR}${APK_FINAL_NAME}"
                    } else {
                        error "APK 파일을 찾을 수 없습니다."
                    }
                }
            }
        }

        stage('Archive APK') {
            steps {
                echo 'Archiving DONZOOM.apk...'
                archiveArtifacts allowEmptyArchive: false, artifacts: "${APK_OUTPUT_DIR}${APK_FINAL_NAME}"  // 상대 경로로 아카이브
            }
        }
    }

    post {
        always {
            echo 'Frontend pipeline finished.'
        }
        success {
            echo 'Frontend pipeline completed successfully.'
        }
        failure {
            echo 'Frontend pipeline failed.'
        }
    }
}
