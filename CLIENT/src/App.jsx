import { BrowserRouter, Route, Routes } from 'react-router-dom';
import routes from './routes';
import { Suspense } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          {routes.map((item, index) => {
            return (
              <Route
                path={item.path}
                element={<item.component />}
                key={index}
              />
            );
          })}
        </Routes>
      </Suspense>
      
      {/*toast hiển thị */}
      <ToastContainer
        position='top-right'
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme='colored'
      />
    </BrowserRouter>
  );
}

export default App;