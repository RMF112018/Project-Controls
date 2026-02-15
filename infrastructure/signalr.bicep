// ============================================================================
// HBC Project Controls — SignalR Infrastructure
// Azure SignalR Service (Serverless) + Azure Functions v4
// ============================================================================
// Usage:
//   az deployment group create \
//     --resource-group rg-hbc-projectcontrols \
//     --template-file signalr.bicep \
//     --parameters environment=dev aadClientId=<func-app-client-id> aadTenantId=<tenant-id>
// ============================================================================

@description('Environment name (dev, vetting, prod)')
@allowed(['dev', 'vetting', 'prod'])
param environment string

@description('Azure AD tenant ID')
param aadTenantId string

@description('Azure AD client ID for the Function App')
param aadClientId string

@description('Location for all resources')
param location string = resourceGroup().location

// Naming convention
var suffix = 'hbc-signalr-${environment}'
var signalRName = 'sigr-${suffix}'
var functionAppName = 'func-${suffix}'
var storageName = 'sthbc${environment}signalr'
var appInsightsName = 'appi-${suffix}'
var appServicePlanName = 'asp-${suffix}'

// Allowed origins for CORS
var allowedOrigins = [
  'https://hedrickbrotherscom.sharepoint.com'
  'https://localhost:4321'
]

// ---- Azure SignalR Service (Serverless mode) ----
resource signalR 'Microsoft.SignalRService/signalR@2024-03-01' = {
  name: signalRName
  location: location
  sku: {
    name: 'Standard_S1'
    tier: 'Standard'
    capacity: 1
  }
  kind: 'SignalR'
  properties: {
    features: [
      {
        flag: 'ServiceMode'
        value: 'Serverless'
      }
      {
        flag: 'EnableConnectivityLogs'
        value: 'True'
      }
      {
        flag: 'EnableMessagingLogs'
        value: 'True'
      }
    ]
    cors: {
      allowedOrigins: allowedOrigins
    }
    upstream: {}
    tls: {
      clientCertEnabled: false
    }
  }
}

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

// ---- App Service Plan (Consumption) ----
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

// ---- Function App (Node.js 20) ----
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
          name: 'AzureSignalRConnectionString'
          value: signalR.listKeys().primaryConnectionString
        }
        {
          name: 'AAD_TENANT_ID'
          value: aadTenantId
        }
        {
          name: 'AAD_CLIENT_ID'
          value: aadClientId
        }
      ]
    }
  }
}

// ---- RBAC: Function App → SignalR Service Owner ----
var signalRServiceOwnerRoleId = '7e4f1700-ea5a-4f59-8f37-079cfe29dce3'

resource signalRRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(signalR.id, functionApp.id, signalRServiceOwnerRoleId)
  scope: signalR
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', signalRServiceOwnerRoleId)
    principalId: functionApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

// ---- Outputs ----
output signalREndpoint string = 'https://${signalR.properties.hostName}'
output functionAppUrl string = 'https://${functionApp.properties.defaultHostName}'
output functionAppPrincipalId string = functionApp.identity.principalId
