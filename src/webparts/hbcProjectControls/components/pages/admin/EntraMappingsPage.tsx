import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Select,
  makeStyles,
  shorthands,
  tokens,
} from '@fluentui/react-components';
import {
  AuditAction,
  EntityType,
  RoleName,
  graphService,
  type IEntraDirectoryPrincipal,
  type ISecurityGroupMapping,
  type IPermissionTemplate,
} from '@hbc/sp-services';
import { PageHeader } from '../../shared/PageHeader';
import { HbcButton } from '../../shared/HbcButton';
import { HbcDataTable } from '../../shared/HbcDataTable';
import type { IHbcDataTableColumn } from '../../shared/HbcDataTable';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { useAppContext } from '../../contexts/AppContext';
import { useToast } from '../../shared/ToastContainer';

const ROLE_TO_GROUP_NAME: Partial<Record<RoleName, string>> = {
  [RoleName.Administrator]: 'HBC - SharePoint Admins',
  [RoleName.Leadership]: 'HBC - Executive Leadership',
  [RoleName.MarketingManager]: 'HBC - Business Development',
  [RoleName.PreconstructionManager]: 'HBC - Estimating',
  [RoleName.BusinessDevelopmentManager]: 'HBC - Business Development',
  [RoleName.Estimator]: 'HBC - Estimating',
  [RoleName.IDSManager]: 'HBC - Read Only',
  [RoleName.CommercialOperationsManager]: 'HBC - Project Managers',
  [RoleName.LuxuryResidentialManager]: 'HBC - Project Managers',
  [RoleName.ManagerOfOperationalExcellence]: 'HBC - Project Managers',
  [RoleName.SafetyManager]: 'HBC - Read Only',
  [RoleName.QualityControlManager]: 'HBC - Read Only',
  [RoleName.WarrantyManager]: 'HBC - Read Only',
  [RoleName.HumanResourcesManager]: 'HBC - Read Only',
  [RoleName.AccountingManager]: 'HBC - Accounting',
  [RoleName.RiskManager]: 'HBC - Read Only',
};

const useStyles = makeStyles({
  container: {
    ...shorthands.padding('16px', '0'),
    display: 'grid',
    ...shorthands.gap('12px'),
  },
  controls: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    ...shorthands.gap('12px'),
    alignItems: 'end',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    ...shorthands.gap('8px'),
  },
  meta: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
});

export const EntraMappingsPage: React.FC = () => {
  const styles = useStyles();
  const { dataService, currentUser, dataServiceMode } = useAppContext();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const isPreviewOnly = dataServiceMode !== 'sharepoint';

  const [search, setSearch] = React.useState('');
  const [selectedPrincipalId, setSelectedPrincipalId] = React.useState('');
  const [selectedRoleName, setSelectedRoleName] = React.useState<RoleName | ''>('');

  const securityMappingsQuery = useQuery({
    queryKey: ['entra-mappings', 'security-group-mappings'],
    queryFn: () => dataService.getSecurityGroupMappings(),
  });

  const templatesQuery = useQuery({
    queryKey: ['entra-mappings', 'permission-templates'],
    queryFn: () => dataService.getPermissionTemplates(),
  });

  const groupsQuery = useQuery({
    queryKey: ['entra-mappings', 'groups', search],
    queryFn: async () => {
      try {
        return await graphService.getEntraSecurityGroups(search, 75);
      } catch {
        return [] as IEntraDirectoryPrincipal[];
      }
    },
  });

  const rolesQuery = useQuery({
    queryKey: ['entra-mappings', 'roles', search],
    queryFn: async () => {
      try {
        return await graphService.getEntraDirectoryRoles(search, 75);
      } catch {
        return [] as IEntraDirectoryPrincipal[];
      }
    },
  });

  const principals = React.useMemo(() => {
    const merged = [...(groupsQuery.data ?? []), ...(rolesQuery.data ?? [])];
    const unique = new Map<string, IEntraDirectoryPrincipal>();
    for (const principal of merged) {
      if (!unique.has(principal.id)) {
        unique.set(principal.id, principal);
      }
    }
    return Array.from(unique.values()).sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [groupsQuery.data, rolesQuery.data]);

  const selectedPrincipal = React.useMemo(
    () => principals.find(principal => principal.id === selectedPrincipalId) ?? null,
    [principals, selectedPrincipalId]
  );

  const templatesById = React.useMemo(() => {
    const byId = new Map<number, IPermissionTemplate>();
    for (const template of templatesQuery.data ?? []) {
      byId.set(template.id, template);
    }
    return byId;
  }, [templatesQuery.data]);

  const resolveTemplateId = React.useCallback((roleName: RoleName): number | null => {
    const canonicalGroup = ROLE_TO_GROUP_NAME[roleName];
    if (!canonicalGroup) return null;
    const mapping = (securityMappingsQuery.data ?? []).find(
      m => m.isActive && m.securityGroupName === canonicalGroup && m.defaultTemplateId > 0
    );
    return mapping?.defaultTemplateId ?? null;
  }, [securityMappingsQuery.data]);

  const applyMappingMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPrincipal) {
        throw new Error('Select an Entra group or role.');
      }
      if (!selectedRoleName) {
        throw new Error('Select an internal app role.');
      }
      const templateId = resolveTemplateId(selectedRoleName);
      if (!templateId) {
        throw new Error(`No active default template mapping exists for role "${selectedRoleName}".`);
      }

      const existing = (securityMappingsQuery.data ?? []).find(
        mapping => mapping.securityGroupId === selectedPrincipal.id
      );

      const payload: Partial<ISecurityGroupMapping> = {
        securityGroupId: selectedPrincipal.id,
        securityGroupName: selectedPrincipal.displayName,
        defaultTemplateId: templateId,
        isActive: true,
      };

      if (existing) {
        await dataService.updateSecurityGroupMapping(existing.id, payload);
      } else {
        await dataService.createSecurityGroupMapping(payload);
      }

      await dataService.logAudit({
        Action: AuditAction.SecurityGroupMappingChanged,
        EntityType: EntityType.Permission,
        EntityId: selectedPrincipal.id,
        User: currentUser?.email || 'unknown',
        Details: JSON.stringify({
          principalType: selectedPrincipal.principalType,
          principalName: selectedPrincipal.displayName,
          mappedRoleName: selectedRoleName,
          templateId,
          mode: existing ? 'updated' : 'created',
        }),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['entra-mappings', 'security-group-mappings'] });
      addToast('Entra mapping applied successfully.', 'success');
    },
    onError: (error) => {
      addToast(error.message || 'Failed to apply Entra mapping.', 'error');
    },
  });

  const loading = securityMappingsQuery.isLoading || templatesQuery.isLoading;

  const mappingColumns = React.useMemo((): IHbcDataTableColumn<ISecurityGroupMapping>[] => [
    {
      key: 'securityGroupName',
      header: 'Entra Group/Role',
      render: (row) => row.securityGroupName || '\u2014',
    },
    {
      key: 'securityGroupId',
      header: 'Principal ID',
      render: (row) => row.securityGroupId || '\u2014',
    },
    {
      key: 'defaultTemplateId',
      header: 'Template',
      render: (row) => {
        const template = templatesById.get(row.defaultTemplateId);
        return template ? `${template.name} (#${template.id})` : `#${row.defaultTemplateId}`;
      },
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (row) => row.isActive ? 'Active' : 'Inactive',
    },
  ], [templatesById]);

  if (loading) {
    return (
      <div>
        <PageHeader title="Entra ID Role Mapping" />
        <div className={styles.container}>
          <HbcSkeleton variant="text" rows={4} />
          <HbcSkeleton variant="table" rows={5} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Entra ID Role Mapping"
        subtitle="Map Microsoft Entra security groups or directory roles to internal app roles."
      />
      <div className={styles.container}>
        {isPreviewOnly ? (
          <MessageBar intent="warning">
            <MessageBarBody>
              Preview mode is active ({dataServiceMode}). You can browse Entra principals, but Apply Mapping is disabled outside SharePoint mode.
            </MessageBarBody>
          </MessageBar>
        ) : (
          <MessageBar intent="success">
            <MessageBarBody>
              Production mode is active. Applying a mapping writes to Security_Group_Mappings immediately.
            </MessageBarBody>
          </MessageBar>
        )}

        <div className={styles.controls}>
          <Field label="Search Entra Group/Role">
            <Input
              value={search}
              onChange={(_, data) => setSearch(data.value)}
              placeholder="Search groups or roles"
              data-testid="entra-mappings-search"
            />
          </Field>
          <Field label="Select Entra Group/Role" required>
            <Select
              value={selectedPrincipalId}
              onChange={(_, data) => setSelectedPrincipalId(data.value)}
              data-testid="entra-mappings-principal-select"
            >
              <option value="">Select principal</option>
              {principals.map(principal => (
                <option key={principal.id} value={principal.id}>
                  {principal.displayName} ({principal.principalType === 'securityGroup' ? 'Group' : 'Directory Role'})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Internal App Role" required>
            <Select
              value={selectedRoleName}
              onChange={(_, data) => setSelectedRoleName(data.value as RoleName)}
              data-testid="entra-mappings-role-select"
            >
              <option value="">Select app role</option>
              {Object.values(RoleName).map(roleName => (
                <option key={roleName} value={roleName}>{roleName}</option>
              ))}
            </Select>
          </Field>
        </div>

        <div className={styles.meta} data-testid="entra-mappings-meta">
          {principals.length} Entra principal(s) loaded. Selected: {selectedPrincipal?.displayName || 'none'}.
        </div>

        <div className={styles.actions}>
          <HbcButton
            emphasis="strong"
            disabled={isPreviewOnly || !selectedPrincipal || !selectedRoleName}
            isLoading={applyMappingMutation.isPending}
            onClick={() => applyMappingMutation.mutate()}
            data-testid="entra-mappings-apply"
          >
            Apply Mapping
          </HbcButton>
        </div>

        <HbcDataTable
          tableId="admin-entra-security-group-mappings"
          columns={mappingColumns}
          items={securityMappingsQuery.data ?? []}
          isLoading={securityMappingsQuery.isLoading}
          keyExtractor={row => String(row.id)}
        />
      </div>
    </div>
  );
};
