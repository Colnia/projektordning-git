import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Project, Quote } from "@/lib/types"

interface ProjectStore {
  projects: Project[]
  archivedProjects: Project[]
  quotes: Quote[]
  archivedQuotes: Quote[]
  isLoading: boolean
  hasInitialized: boolean
  loadProjects: () => Promise<void>
  initializeStore: (data: {
    projects: Project[]
    archivedProjects: Project[]
    quotes: Quote[]
    archivedQuotes: Quote[]
  }) => void
  addProject: (project: Project) => Promise<void>
  updateProject: (project: Project) => Promise<void>
  archiveProject: (project: Project) => Promise<void>
  addQuote: (quote: Quote) => Promise<void>
  updateQuote: (quote: Quote) => Promise<void>
  archiveQuote: (quote: Quote) => Promise<void>
  deleteProject: (projectId: string) => Promise<void>
  deleteQuote: (quoteId: string) => Promise<void>
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: [],
      archivedProjects: [],
      quotes: [],
      archivedQuotes: [],
      isLoading: false,
      hasInitialized: false,

      loadProjects: async () => {
        try {
          set({ isLoading: true });
          
          // Hämta projekt från API
          const projectsResponse = await fetch('/api/projects');
          if (!projectsResponse.ok) {
            throw new Error('Kunde inte hämta projekt');
          }
          
          const projectsData = await projectsResponse.json();
          console.log('Hämtade projekt från API:', projectsData);
          
          // Uppdatera store med projektdata från databasen
          set({
            projects: projectsData,
            isLoading: false,
            hasInitialized: true
          });
        } catch (error) {
          console.error('Fel vid hämtning av projektdata:', error);
          set({ isLoading: false });
        }
      },

      initializeStore: (data) => {
        const { hasInitialized } = get();
        
        // Om datan redan har initialiserats från API, skipp lokal initialisering
        if (hasInitialized) return;
        
        set((state) => ({
          // Bara initiera om store:en är tom
          projects: state.projects.length === 0 ? data.projects : state.projects,
          archivedProjects: state.archivedProjects.length === 0 ? data.archivedProjects : state.archivedProjects,
          quotes: state.quotes.length === 0 ? data.quotes : state.quotes,
          archivedQuotes: state.archivedQuotes.length === 0 ? data.archivedQuotes : state.archivedQuotes,
        }));
      },

      addProject: async (project) => {
        try {
          // Skicka projektet till API:et
          const response = await fetch('/api/projects', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(project),
          });

          if (!response.ok) {
            throw new Error('Kunde inte skapa projekt');
          }

          const data = await response.json();
          
          // Uppdatera store med det nya projektet
          set((state) => ({
            projects: [...state.projects, data.project],
          }));
          
          return data.project;
        } catch (error) {
          console.error('Fel vid skapande av projekt:', error);
          throw error;
        }
      },

      updateProject: async (updatedProject) => {
        try {
          // Uppdatera projektet via API
          const response = await fetch(`/api/projects/${updatedProject.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedProject),
          });

          if (!response.ok) {
            throw new Error('Kunde inte uppdatera projekt');
          }

          // Uppdatera lokalt state
          set((state) => ({
            projects: state.projects.map((project) => 
              project.id === updatedProject.id ? updatedProject : project
            ),
            archivedProjects: state.archivedProjects.map((project) =>
              project.id === updatedProject.id ? updatedProject : project
            ),
          }));
        } catch (error) {
          console.error('Fel vid uppdatering av projekt:', error);
          throw error;
        }
      },

      archiveProject: async (project) => {
        try {
          // Uppdatera projektstatus via API
          const response = await fetch(`/api/projects/${project.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ...project, isArchived: true }),
          });

          if (!response.ok) {
            throw new Error('Kunde inte arkivera projekt');
          }

          // Uppdatera lokalt state
          set((state) => ({
            projects: state.projects.filter((p) => p.id !== project.id),
            archivedProjects: [...state.archivedProjects, { ...project, isArchived: true }],
          }));
        } catch (error) {
          console.error('Fel vid arkivering av projekt:', error);
          throw error;
        }
      },

      addQuote: async (quote) => {
        // Implementeras senare när quote-API:t finns
        set((state) => ({
          quotes: [...state.quotes, quote],
        }));
      },

      updateQuote: async (updatedQuote) => {
        // Implementeras senare när quote-API:t finns
        set((state) => ({
          quotes: state.quotes.map((quote) => (quote.id === updatedQuote.id ? updatedQuote : quote)),
          archivedQuotes: state.archivedQuotes.map((quote) => (quote.id === updatedQuote.id ? updatedQuote : quote)),
        }));
      },

      archiveQuote: async (quote) => {
        // Implementeras senare när quote-API:t finns
        set((state) => ({
          quotes: state.quotes.filter((q) => q.id !== quote.id),
          archivedQuotes: [...state.archivedQuotes, quote],
        }));
      },

      deleteProject: async (projectId) => {
        try {
          // Ta bort projektet via API
          const response = await fetch(`/api/projects/${projectId}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            throw new Error('Kunde inte ta bort projekt');
          }

          // Uppdatera lokalt state
          set((state) => ({
            projects: state.projects.filter((p) => p.id !== projectId),
            archivedProjects: state.archivedProjects.filter((p) => p.id !== projectId),
          }));
        } catch (error) {
          console.error('Fel vid borttagning av projekt:', error);
          throw error;
        }
      },

      deleteQuote: async (quoteId) => {
        // Implementeras senare när quote-API:t finns
        set((state) => ({
          quotes: state.quotes.filter((q) => q.id !== quoteId),
        }));
      },
    }),
    {
      name: "project-storage", // Unikt namn för localStorage nyckeln
      partialize: (state) => ({
        // Spara bara vissa delar i localStorage
        quotes: state.quotes,
        archivedQuotes: state.archivedQuotes,
        // Projekten hämtas från databasen istället
      }),
    },
  ),
)

