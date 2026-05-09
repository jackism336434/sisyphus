import Sidebar from './Sidebar'
import TopNav from './TopNav'
import HomeWorkspace from '../workspace/HomeWorkspace'
import ChatView from '../chat/ChatView'
import SettingsView from '../settings/SettingsView'
import AccountView from '../settings/AccountView'
import CustomAssistantsView from '../custom/CustomAssistantsView'
import { useAppStore } from '../../stores/appStore'

export default function AppLayout(): JSX.Element {
  const currentView = useAppStore((s) => s.currentView)

  return (
    <div className="flex h-screen w-screen bg-surface">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <TopNav />
        <main className="flex-1 overflow-y-auto">
          {currentView === 'home' && <HomeWorkspace />}
          {currentView === 'chat' && <ChatView />}
          {currentView === 'settings' && <SettingsView />}
          {currentView === 'account' && <AccountView />}
          {currentView === 'custom' && <CustomAssistantsView />}
        </main>
      </div>
    </div>
  )
}
