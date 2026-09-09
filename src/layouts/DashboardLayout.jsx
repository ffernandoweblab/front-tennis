import Sidebar from "../components/Sidebar";

function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-bg text-text font-body">
      <Sidebar />
      <main className="flex-1 px-10 py-8">
        {children}
      </main>
    </div>
  );
}

export default DashboardLayout;