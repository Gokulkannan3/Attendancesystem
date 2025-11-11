import Navbar from "../pages/Navbar.jsx"
import AppRouter from "./router.jsx"
import './App.css'

function App() {
  return (
    <div className="app-container">
      <Navbar />
      <main className="app-main">
        <AppRouter />
      </main>
    </div>
  )
}

export default App