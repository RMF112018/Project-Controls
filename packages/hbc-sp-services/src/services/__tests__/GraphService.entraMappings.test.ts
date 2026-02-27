import { GraphService } from '../GraphService';

type MockApiChain = {
  select: jest.Mock;
  filter: jest.Mock;
  top: jest.Mock;
  get: jest.Mock;
};

function createChain(getResult: unknown): MockApiChain {
  const chain: MockApiChain = {
    select: jest.fn(),
    filter: jest.fn(),
    top: jest.fn(),
    get: jest.fn().mockResolvedValue(getResult),
  };
  chain.select.mockReturnValue(chain);
  chain.filter.mockReturnValue(chain);
  chain.top.mockReturnValue(chain);
  return chain;
}

describe('GraphService Entra directory listing', () => {
  it('maps and filters security groups', async () => {
    const groupsChain = createChain({
      value: [
        { id: 'g-1', displayName: 'HBC - Accounting', description: 'Accounting', securityEnabled: true },
        { id: 'g-2', displayName: 'Visitors', description: 'Read only', securityEnabled: true },
      ],
    });
    const directoryRolesChain = createChain({ value: [] });

    const graphClient = {
      api: jest.fn((path: string) => {
        if (path === '/groups') return groupsChain;
        return directoryRolesChain;
      }),
    };

    const service = new GraphService();
    service.initialize(graphClient);

    const result = await service.getEntraSecurityGroups('account', 50);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 'g-1',
      displayName: 'HBC - Accounting',
      description: 'Accounting',
      principalType: 'securityGroup',
    });
    expect(graphClient.api).toHaveBeenCalledWith('/groups');
    expect(groupsChain.filter).toHaveBeenCalledWith('securityEnabled eq true');
  });

  it('maps and filters directory roles', async () => {
    const directoryRolesChain = createChain({
      value: [
        { id: 'r-1', displayName: 'Global Administrator', description: 'Global admins' },
        { id: 'r-2', displayName: 'User Administrator', description: 'User admins' },
      ],
    });
    const graphClient = {
      api: jest.fn(() => directoryRolesChain),
    };

    const service = new GraphService();
    service.initialize(graphClient);

    const result = await service.getEntraDirectoryRoles('global', 100);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 'r-1',
      displayName: 'Global Administrator',
      description: 'Global admins',
      principalType: 'directoryRole',
    });
    expect(graphClient.api).toHaveBeenCalledWith('/directoryRoles');
  });

  it('throws when graph client has not been initialized', async () => {
    const service = new GraphService();
    await expect(service.getEntraSecurityGroups()).rejects.toThrow('Graph client not initialized');
    await expect(service.getEntraDirectoryRoles()).rejects.toThrow('Graph client not initialized');
  });
});
