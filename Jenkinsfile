pipeline {
    agent any

        environment {
        IMAGE_NAME_FRONTEND = "${params.IMAGE_NAME_FRONTEND}"
        IMAGE_NAME_BACKEND  = "${params.IMAGE_NAME_BACKEND}"
        IMAGE_TAG           = "${params.IMAGE_TAG}"         
        GAR_REGISTRY      = "${params.DOCKER_REG_URL}" 
        GCP_PROJECT     = "${params.DOCKER_REG_NAME}" 
        GAR_REPO            = "${params.REG_REPO}"        
        }

        stages {
        stage('GCP AUTH') {
            steps {
                withCredentials([file(credentialsId: 'GCP-GAR', variable: 'GCLOUD_KEY')]) {
                    sh """
                        echo "Authenticating with GCP..."
                        gcloud auth activate-service-account --key-file="$GCLOUD_KEY"
                        gcloud auth configure-docker $GAR_REGISTRY
                    """
                }
            }
        }

                stage('Deploy with Docker Compose') {
            steps {
                sh """
                    echo "IMAGE_TAG= $IMAGE_TAG" > .env

                    echo "Creating docker-compose.yml..."
                    cat <<EOF > docker-compose.yml
                 
version: "3.9"

services:
  mysql:
    image: mysql:8.0
    container_name: mysql-db
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: rootpass
      MYSQL_DATABASE: community_platform
      MYSQL_USER: appuser
      MYSQL_PASSWORD: apppass
    ports:
      - "3307:3306"   # host:container (avoid clashing with local MySQL on 3306)
    volumes:
      - db_data:/var/lib/mysql

  backend:
    image: $GAR_REGISTRY/$GCP_PROJECT/$GAR_REPO/$IMAGE_NAME_BACKEND:$IMAGE_TAG
    container_name: backend
    restart: always
    depends_on:
      - mysql
    environment:
      DB_HOST: mysql
      DB_PORT: 3306
      DB_NAME: community_platform
      DB_USER: appuser
      DB_PASS: apppass
      NODE_ENV: production
      PORT: 5000
    ports:
      - "5050:5000"   # Backend runs on port 5000 internally, exposed on 5050
    volumes:
      - ./uploads:/app/uploads

  frontend:
    image: $GAR_REGISTRY/$GCP_PROJECT/$GAR_REPO/$IMAGE_NAME_FRONTEND:$IMAGE_TAG
    container_name: frontend
    restart: always
    depends_on:
      - backend
    ports:
      - "3000:80"     # assuming frontend image is served by nginx on 80
    environment:
      REACT_APP_API_URL: http://backend:5000
      REACT_APP_SOCKET_URL: http://backend:5000

volumes:
  db_data:
    
EOF

                    echo "Stopping existing containers..."
                    docker compose down || true

                    echo "Pulling updated images..."
                    docker compose pull

                    echo "Launching updated containers..."
                    docker compose up -d --force-recreate --remove-orphans

                    docker ps
                """
            }
        }
    }
}

