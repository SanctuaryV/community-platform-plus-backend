
pipeline {
    agent any

    parameters {
        string(name: 'REPO_URL', defaultValue: 'https://github.com/SanctuaryV/community-platform-plus-backend.git', description: 'Git repo URL')
        string(name: 'REPO_BRANCH', defaultValue: 'main', description: 'Branch to checkout')
        booleanParam(name: 'Run_Checkmarx', defaultValue: false, description: 'Run Checkmarx scan')
    }

    environment {
        APP_REPO_URL    = "${params.REPO_URL}"
        APP_REPO_BRANCH = "${params.REPO_BRANCH}"
    }

    stages {
        stage('Clone Repository') {
            steps {
                cleanWs()
                git branch: "${APP_REPO_BRANCH}",
                    url: "${APP_REPO_URL}"
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                  echo "Installing depaendencies..."
                  npm install
                '''
            }
        }


        stage('SAST - Checkmarx') {
            when {
                expression { return params.Run_Checkmarx == true }
            }
            steps {
                checkmarxASTScanner additionalOptions: '--project-groups intern --scan-types "sast,sca"',
                    baseAuthUrl: '',
                    branchName: "${APP_REPO_BRANCH}",
                    checkmarxInstallation: 'Checkmarx',
                    credentialsId: '',
                    projectName: "SanctuaryV/community-platform-plus-frontend",
                    serverUrl: '',
                    tenantName: '',
                    useOwnAdditionalOptions: true
            }
        }
    }
}

