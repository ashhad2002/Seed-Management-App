import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQrcode, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import SeedDataForm from '../SeedDataForm';
import QRCodeScanner from '../QRCodeScanner';
import httpClient from '../../httpClient';
import GalleryModal from '../GalleryModal';

const SeedDataList = () => {
  const [seeds, setSeeds] = useState([]);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editSeed, setEditSeed] = useState(null);
  const [filters, setFilters] = useState({
    germinated: false,
    vigorous: false,
    small: false,
    abnormal: false,
    usable: false,
  });

  const handleOpenPictureModal = async (seedDataId) => {
    setLoading(true);
    try {
      const response = await httpClient.get(`/pictures/${seedDataId}`);
      const data = response.data;
      setImages(data.pictures);
      setModalOpen(true);
    } catch (err) {
      console.error('Failed to fetch pictures:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClosePictureModal = () => {
    setModalOpen(false);
    setImages([]);
  };

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => {
    setShowModal(false);
    setEditSeed(null);
  };

  const handleSeedAdded = async () => {
    try {
      console.log('Seed added successfully');
      const response = await httpClient.get('/seeds');
      setSeeds(response.data);
    } catch (err) {
      setError('Failed to fetch seed data.');
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchSeeds = async () => {
      try {
        const response = await httpClient.get('/seeds');
        setSeeds(response.data);
      } catch (err) {
        setError('Failed to fetch seed data.');
        console.error(err);
      }
    };

    fetchSeeds();
  }, []);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    const [hours, minutes] = time.split(':');
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  };

  const filteredSeeds = seeds.filter((seed) => {
    return (seed.qr_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    seed.seed_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    seed.description?.toLowerCase().includes(searchQuery.toLowerCase())) &&
    ((seed.germinated === filters.germinated || !filters.germinated) && (seed.vigorous === filters.vigorous || !filters.vigorous) && (seed.small === filters.small || !filters.small) && (seed.abnormal === filters.abnormal || !filters.abnormal) && (seed.usable === filters.usable || !filters.usable));
  });

  useEffect(() => {
    console.log('Search Query Updated:', searchQuery);
  }, [searchQuery]);

  const handleQrScan = (scannedValue) => {
    console.log('Scanned Value:', scannedValue);
    setSearchQuery(scannedValue);
    setShowScanner(false);
  };

  const handleEditSeed = (seed) => {
    setEditSeed(seed);
    setShowModal(true);
  };

  const handleDeleteSeed = async (id) => {
    if (window.confirm('Are you sure you want to delete this seed?')) {
      try {
        await httpClient.delete(`/seeds/${id}`);
        setSeeds(seeds.filter(seed => seed.id !== id));
      } catch (err) {
        setError('Failed to delete seed data.');
        console.error(err);
      }
    }
  };

  return (
    <div className="shadow-md">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Seed Data</h1>
      <button
        className="mb-4 p-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600"
        onClick={handleOpenModal}
      >
        Add seed
      </button>
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Search by QR code, Seed ID, or Description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-2 pl-3 pr-10 border border-gray-300 rounded w-full"
        />
        <span className="absolute right-3 top-2 text-gray-500" onClick={() => setShowScanner(!showScanner)}>
          <FontAwesomeIcon icon={faQrcode} size='lg' />
        </span>
      </div>
      {showScanner && <QRCodeScanner onScan={handleQrScan} showScanner={showScanner} />}
      {error && <p className="text-red-600">{error}</p>}
      {isModalOpen && (<GalleryModal
        onClose={handleClosePictureModal}
        images={images}
        loading={loading}
      />)}
       <div className="relative grid grid-cols-5 items-center justify-center text-center">
        <div>
          <input
            type="checkbox"
            name="germinated"
            checked={filters.germinated}
            onChange={(e) => setFilters({ ...filters, germinated: e.target.checked })}
            className="mr-2"
          />
          <label className="text-sm font-medium text-gray-700">Germinated</label>
        </div>
        <div>
          <input
            type="checkbox"
            name="vigorous"
            checked={filters.vigorous}
            onChange={(e) => setFilters({ ...filters, vigorous: e.target.checked })}
            className="mr-2"
          />
          <label className="text-sm font-medium text-gray-700">Vigorous</label>
        </div>
        <div>
          <input
            type="checkbox"
            name="small"
            checked={filters.small}
            onChange={(e) => setFilters({ ...filters, small: e.target.checked })}
            className="mr-2"
          />
          <label className="text-sm font-medium text-gray-700">Small</label>
        </div>
        <div>
          <input
            type="checkbox"
            name="abnormal"
            checked={filters.abnormal}
            onChange={(e) => setFilters({ ...filters, abnormal: e.target.checked })}
            className="mr-2"
          />
          <label className="text-sm font-medium text-gray-700">Abnormal</label>
        </div>
        <div>
          <input
            type="checkbox"
            name="usable"
            checked={filters.usable}
            onChange={(e) => setFilters({ ...filters, usable: e.target.checked })}
            className="mr-2"
          />
          <label className="text-sm font-medium text-gray-700">Usable</label>
        </div>
      </div>
      {filteredSeeds.length === 0 ? (
        <p className="text-gray-700">No seed data available.</p>
      ) : (
        <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">QR Code</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seed ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Germinated</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vigorous</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Small</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Abnormal</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usable</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group Size</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day Number</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Scanned</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Scanned</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Has Pictures</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSeeds.map(seed => (
              <tr key={seed.id}>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{seed.id}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{seed.qr_code}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{seed.seed_id}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="truncate max-w-xs" title={seed.description}>
                    {seed.description}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{seed.germinated ? 'Yes' : 'No'}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{seed.vigorous ? 'Yes' : 'No'}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{seed.small ? 'Yes' : 'No'}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{seed.abnormal ? 'Yes' : 'No'}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{seed.usable ? 'Yes' : 'No'}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{seed.group_size}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{seed.day_number}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(seed.date_scanned)}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{formatTime(seed.time_scanned)}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{seed.has_pictures ? (
                  <button
                    onClick={() => handleOpenPictureModal(seed.id)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    Yes
                  </button>
                  ) : (
                    'No'
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button
                    onClick={() => handleEditSeed(seed)}
                    className="text-yellow-500 hover:text-yellow-700 mr-2"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  <button
                    onClick={() => handleDeleteSeed(seed.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
      {(showModal || editSeed) && (
        <SeedDataForm 
          onClose={handleCloseModal} 
          onSeedAdded={handleSeedAdded} 
          seed={editSeed}
        />
      )}
    </div>
  );
};

export default SeedDataList;