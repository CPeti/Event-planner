# Tiltfile for Event-planner

# 1. Deploy Infrastructure (Database)
k8s_yaml(helm('./charts/infra', name='infra'))
k8s_resource('infra-db', port_forwards=['5432:5432'])

# 2. Build and Deploy Backend
docker_build(
    'event-planner-backend',
    './backend',
    dockerfile='./backend/Dockerfile'
)

k8s_yaml(helm('./charts/backend', name='backend'))
k8s_resource('backend-backend', port_forwards=['8000:8000'], resource_deps=['infra-db'])

# 3. Build and Deploy Frontend
# Use docker_build with live_update for hot reload (syncing files into the running container)
docker_build(
    'event-planner-frontend',
    './frontend',
    dockerfile='./frontend/Dockerfile.dev',
    live_update=[
        sync('./frontend', '/app'),
        sync('./frontend/public', '/app/public'),
        sync('./frontend/index.html', '/app/index.html'),
    ]
)

k8s_yaml(helm('./charts/frontend', name='frontend'))
k8s_resource('frontend-frontend', port_forwards=['5173:5173'], resource_deps=['backend-backend'])
