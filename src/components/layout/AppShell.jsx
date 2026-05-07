import AppNavbar from './AppNavbar'
import PageContainer from './PageContainer'

export default function AppShell({
  children,
  page,
  onSwitchPage,
  user,
  onLogout,
  onSearchClick,
  onNotifyClick,
}) {
  return (
    <div className="min-h-screen bg-pageBg">
      <AppNavbar
        page={page}
        onSwitchPage={onSwitchPage}
        user={user}
        onLogout={onLogout}
        onSearchClick={onSearchClick}
        onNotifyClick={onNotifyClick}
      />
      <PageContainer>{children}</PageContainer>
    </div>
  )
}
