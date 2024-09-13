import React, { useState, useEffect } from 'react';
import httpClient from '../../httpClient';
import QRCodeScanner from '../QRCodeScanner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQrcode } from '@fortawesome/free-solid-svg-icons';

const SeedDataForm = ({ onClose, onSeedAdded, seed }) => {
    const [formData, setFormData] = useState({
        qr_code: '',
        seed_id: '',
        description: '',
        germinated: false,
        vigorous: false,
        small: false,
        abnormal: false,
        usable: false,
        group_size: '',
        day_number: '',
        date_scanned: seed?.date_scanned || new Date().toISOString().split('T')[0],
        time_scanned: seed?.time_scanned || new Date().toTimeString().split(' ')[0].substring(0, 5),
        has_pictures: false
    });

    const [message, setMessage] = useState('');
    const [showScanner, setShowScanner] = useState(false);
    const [error, setError] = useState('');
    const [images, setImages] = useState([]);

    const formatDate = (date) => {
      if (!date) return 'N/A';
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const formatTime = (time) => {
      if (!time) return '';
      return time;
    };

    useEffect(() => {
        if (seed) {
            setFormData({
                qr_code: seed.qr_code || '',
                seed_id: seed.seed_id || '',
                description: seed.description || '',
                germinated: seed.germinated || false,
                vigorous: seed.vigorous || false,
                small: seed.small || false,
                abnormal: seed.abnormal || false,
                usable: seed.usable || false,
                group_size: seed.group_size || '',
                day_number: seed.day_number || '',
                date_scanned: formatDate(seed.date_scanned) || new Date().toISOString().split('T')[0],
                time_scanned: formatTime(seed.time_scanned),
                has_pictures: seed.has_pictures || false
            });
        }
    }, [seed]);

    const handleImageChange = (e) => {
        setImages([...e.target.files]);
        setFormData({ ...formData, has_pictures: e.target.files.length > 0 });
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const saveDataLocally = async (data) => {
      const imageBase64Promises = images.map(file => getImageBase64(file));
      const imageBase64s = await Promise.all(imageBase64Promises);

          const formDataToSubmit = {
            ...data,
            images: imageBase64s
        };
        const seedQueue = JSON.parse(localStorage.getItem('seedQueue')) || [];
        seedQueue.push(formDataToSubmit);
        localStorage.setItem('seedQueue', JSON.stringify(seedQueue));
    };

    const getImageBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const submitSeedData = async (data) => {
        const imageBase64Promises = images.map(file => getImageBase64(file));
        const imageBase64s = await Promise.all(imageBase64Promises);

        const formDataToSubmit = {
            ...data,
            images: imageBase64s
        };

        try {
            if (seed) {
                await httpClient.put(`/seeds/${seed.id}`, formDataToSubmit);
            } else {
                await httpClient.post('/seeds', formDataToSubmit);
            }
            setError('');
            setMessage('Seed data successfully uploaded.');
            setFormData({
                qr_code: '',
                seed_id: '',
                description: '',
                germinated: false,
                vigorous: false,
                small: false,
                abnormal: false,
                usable: false,
                group_size: '',
                day_number: '',
                date_scanned: new Date().toISOString().split('T')[0],
                time_scanned: new Date().toTimeString().split(' ')[0].substring(0, 5),
                has_pictures: false
            });
            setImages([]);
            if (onSeedAdded) onSeedAdded();
        } catch (error) {
            setError('Failed to upload seed data.');
            setMessage('');
        }
    };

    const handleSubmit = async (e) => {
        setMessage('');
        setError('');
        e.preventDefault();

        if (!navigator.onLine) {
            saveDataLocally(formData);
            setMessage('You are offline. The seed data will be submitted when back online.');
            return;
        }

        try {
            await submitSeedData(formData);
        } catch (err) {
            setError('Failed to upload seed data.');
        }
    };

    // Function to process queued data when the user goes online, could update this to run via a button click or a timer instead
    const processQueuedData = async () => {
        const seedQueue = JSON.parse(localStorage.getItem('seedQueue')) || [];

        while (seedQueue.length > 0) {
            const seedData = seedQueue.shift();
            try {
                await submitSeedData(seedData);
            } catch (err) {
                console.error('Failed to upload queued seed data:', err);
                seedQueue.unshift(seedData);
                break;
            }
        }

        localStorage.setItem('seedQueue', JSON.stringify(seedQueue));
    };

    useEffect(() => {
        window.addEventListener('online', processQueuedData);
        return () => {
            window.removeEventListener('online', processQueuedData);
        };
    }, []);

    const handleQrScan = (scannedValue) => {
      console.log('Scanned Value:', scannedValue);
      setFormData({
        ...formData,
        qr_code: scannedValue,
      });
      setShowScanner(false);
    };

    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-4 rounded-lg shadow-lg max-w-lg w-full max-h-[95vh] overflow-y-auto">
            <h1 className="text-2xl font-bold mb-2 text-gray-800">{seed ? 'Edit Seed Data' : 'Upload Seed Data'}</h1>
            <form onSubmit={handleSubmit} className="space-y-1">
              <div className="relative flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">QR Code:</label>
                <input
                  type="text"
                  name="qr_code"
                  value={formData.qr_code}
                  onChange={handleChange}
                  required
                  className="p-2 border border-gray-300 rounded-lg"
                />
                <span className="absolute right-3 top-8 text-gray-500" 
                onClick={() => setShowScanner(!showScanner)}
                >
                  <FontAwesomeIcon icon={faQrcode} size='lg' />
                </span>
              </div>
              {showScanner && (<QRCodeScanner onScan={handleQrScan} showScanner={showScanner}/>)}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Seed ID:</label>
                <input
                  type="text"
                  name="seed_id"
                  value={formData.seed_id}
                  onChange={handleChange}
                  required
                  className="p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Description:</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="germinated"
                    checked={formData.germinated}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">Germinated</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="vigorous"
                    checked={formData.vigorous}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">Vigorous</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="small"
                    checked={formData.small}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">Small</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="abnormal"
                    checked={formData.abnormal}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">Abnormal</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="usable"
                    checked={formData.usable}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">Usable</label>
                </div>
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Group Size:</label>
                <input
                  type="number"
                  name="group_size"
                  value={formData.group_size}
                  onChange={handleChange}
                  className="p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Day Number:</label>
                <input
                  type="number"
                  name="day_number"
                  value={formData.day_number}
                  onChange={handleChange}
                  className="p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Date Scanned:</label>
                <input
                  type="date"
                  name="date_scanned"
                  value={formData.date_scanned}
                  onChange={handleChange}
                  required
                  className="p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Time Scanned:</label>
                <input
                  type="time"
                  name="time_scanned"
                  value={formData.time_scanned}
                  onChange={handleChange}
                  required
                  className="p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Upload Images:</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
                >
                  {seed ? 'Update' : 'Submit'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
            {message && <p className="mt-2 text-green-500">{message}</p>}
            {error && <p className="mt-2 text-red-500">{error}</p>}
        </div>
      </div>
    );
};

export default SeedDataForm;