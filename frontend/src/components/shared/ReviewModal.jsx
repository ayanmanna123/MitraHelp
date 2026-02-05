import { useState } from 'react';
import { FaStar, FaTimes } from 'react-icons/fa';

const ReviewModal = ({ isOpen, onClose, onSubmit, emergency }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [anonymous, setAnonymous] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            alert('Please select a rating');
            return;
        }

        setLoading(true);
        try {
            await onSubmit({
                rating,
                comment: comment.trim(),
                anonymous
            });
            onClose();
        } catch (error) {
            console.error('Error submitting review:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setRating(0);
        setComment('');
        setAnonymous(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Rate Your Experience</h3>
                    <button 
                        onClick={handleCancel}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <FaTimes />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 font-medium mb-2">
                            How was your experience with the volunteer?
                        </label>
                        <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    className={`text-2xl ${star <= (hoverRating || rating) ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400`}
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    disabled={loading}
                                >
                                    <FaStar />
                                </button>
                            ))}
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                            {rating > 0 && `${rating} star${rating !== 1 ? 's' : ''}`}
                        </div>
                    </div>

                    <div className="mb-4">
                        <label htmlFor="comment" className="block text-gray-700 font-medium mb-2">
                            Share your feedback (optional)
                        </label>
                        <textarea
                            id="comment"
                            rows="4"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Tell us about your experience with the volunteer..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div className="mb-6">
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={anonymous}
                                onChange={(e) => setAnonymous(e.target.checked)}
                                className="rounded text-blue-600 focus:ring-blue-500"
                                disabled={loading}
                            />
                            <span className="text-gray-700">Submit anonymously</span>
                        </label>
                    </div>

                    <div className="flex space-x-3">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                            disabled={loading || rating === 0}
                        >
                            {loading ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReviewModal;