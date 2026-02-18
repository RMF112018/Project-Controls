// ============================================================================
// HBC Project Controls — GitOps Provisioning Infrastructure
// Azure Functions v4 (Node 20) + Key Vault for GitHub App Token
// ============================================================================
// Usage:
//   az deployment group create \
//     --resource-group rg-hbc-projectcontrols \
//     --template-file gitops.bicep \
//     --parameters environment=dev \
//                  aadTenantId=<tenant-id> \
//                  aadClientId=<func-app-client-id> \
//                  githubRepoOwner=<owner> \
//                  githubRepoName=<repo> \
//                  keyVaultName=<kv-name>
// ============================================================================

@description('Environment name (dev, vetting, prod)')
@allowed(['dev', 'vetting', 'prod'])
param environment string

@description('Azure AD tenant ID')
param aadTenantId string

@description('Azure AD client ID for the Function App')
param aadClientId string

@description('GitHub repository owner (org or user)')
param githubRepoOwner string

@description('GitHub repository name')
param githubRepoName string

@description('Name of the existing Key Vault that holds the GITHUB_APP_TOKEN secret')
param keyVaultName string

@description('Base branch for GitOps PRs (default: main)')
param githubBaseBranch string = 'main'

@description('Location for all resources')
param location string = resourceGroup().location

// Naming convention
var suffix = 'hbc-gitops-${environment}'
var functionAppName = 'func-${suffix}'
var storageName = 'sthbcgitops${environment}'
var appInsightsName = 'appi-${suffix}'
var appServicePlanName = 'asp-${suffix}'

// Allowed origins for CORS
var allowedOrigins = [
  'https://hedrickbrotherscom.sharepoint.com'
  'https://localhost:4321'
]

// ---- Storage Account (Functions host) ----
resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
  }
}

// ---- Application Insights ----
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    RetentionInDays: 30
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// ---- App Service Plan (Consumption, Linux) ----
resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: appServicePlanName
  location: location
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
  properties: {
    reserved: true // Linux
  }
}

// ---- Function App (Node.js 20, Functions v4) ----
resource functionApp 'Microsoft.Web/sites@2023-12-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'Node|20'
      cors: {
        allowedOrigins: allowedOrigins
        supportCredentials: true
      }
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storage.name};EndpointSuffix=${az.environment().suffixes.storage};AccountKey=${storage.listKeys().keys[0].value}'
        }
        {
          name: 'WEBSITE_CONTENTAZUREFILECONNECTIONSTRING'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storage.name};EndpointSuffix=${az.environment().suffixes.storage};AccountKey=${storage.listKeys().keys[0].value}'
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'node'
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~20'
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsights.properties.ConnectionString
        }
        {
          name: 'AAD_TENANT_ID'
          value: aadTenantId
        }
        {
          name: 'AAD_CLIENT_ID'
          value: aadClientId
        }
        {
          name: 'GITHUB_REPO_OWNER'
          value: githubRepoOwner
        }
        {
          name: 'GITHUB_REPO_NAME'
          value: githubRepoName
        }
        {
          name: 'GITHUB_BASE_BRANCH'
          value: githubBaseBranch
        }
        {
          // Key Vault reference — secret must be named GITHUB-APP-TOKEN in the vault
          name: 'GITHUB_APP_TOKEN'
          value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=GITHUB-APP-TOKEN)'
        }
      ]
    }
  }
}

// ---- Key Vault reference: existing vault ----
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: keyVaultName
}

// ---- Key Vault access policy: grant Function App Secret Get permission ----
resource kvAccessPolicy 'Microsoft.KeyVault/vaults/accessPolicies@2023-07-01' = {
  name: 'add'
  parent: keyVault
  properties: {
    accessPolicies: [
      {
        tenantId: aadTenantId
        objectId: functionApp.identity.principalId
        permissions: {
          secrets: [
            'get'
          ]
        }
      }
    ]
  }
}

// ---- Outputs ----
output functionAppUrl string = 'https://${functionApp.properties.defaultHostName}'
output functionAppName string = functionApp.name
output functionAppPrincipalId string = functionApp.identity.principalId
output storageAccountName string = storage.name
output appInsightsName string = appInsights.name
