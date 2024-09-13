  import React from 'react';

  const GalleryModal = ({ onClose, images, loading }) => {
    return (
      <div
        className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-1"
        onClick={onClose}
      >
        <div
          className="bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-lg font-semibold mb-4">Seed Pictures</h2>
          {loading ? (
            <div className="text-center">
              <p>Loading images...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <img
                  key={index}
                  src={`data:image/jpeg;base64,${image}`}
                  alt={`plant ${index}`}
                  className="max-w-full h-auto rounded-lg"
                />
              ))}
            </div>
          )}
          <button
            onClick={onClose}
            className="mt-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  export default GalleryModal;