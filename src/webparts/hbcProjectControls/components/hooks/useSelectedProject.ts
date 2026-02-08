import { useAppContext } from '../contexts/AppContext';

export const useSelectedProject = () => {
  const { selectedProject, setSelectedProject } = useAppContext();
  return {
    selectedProject,
    setSelectedProject,
    projectCode: selectedProject?.projectCode ?? null,
  };
};
