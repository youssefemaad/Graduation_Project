"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";
import { coachReviewsApi, type CreateCoachReviewDto } from "@/lib/api";
import { Star, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface CoachReviewFormProps {
  isOpen: boolean;
  onClose: () => void;
  coachId: number;
  coachName: string;
  onReviewSubmitted?: () => void;
}

export function CoachReviewForm({
  isOpen,
  onClose,
  coachId,
  coachName,
  onReviewSubmitted,
}: CoachReviewFormProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user?.userId) {
      showToast("Please log in to submit a review", "error");
      return;
    }

    if (rating === 0) {
      showToast("Please select a rating", "warning");
      return;
    }

    if (reviewText.trim().length < 10) {
      showToast("Please write at least 10 characters in your review", "warning");
      return;
    }

    setIsSubmitting(true);

    try {
      const reviewData: CreateCoachReviewDto = {
        coachId,
        rating,
        reviewText: reviewText.trim(),
      };

      const response = await coachReviewsApi.createReview(reviewData);

      if (response.success) {
        showToast("Review submitted successfully! Thank you for your feedback.", "success");
        setRating(0);
        setReviewText("");
        onClose();
        onReviewSubmitted?.();
      } else {
        showToast(response.message || "Failed to submit review", "error");
      }
    } catch (error) {
      console.error("Failed to submit review:", error);
      showToast("Failed to submit review. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setHoveredRating(0);
    setReviewText("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Review {coachName}
          </DialogTitle>
          <DialogDescription>
            Share your experience with your coach session
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Star Rating */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Rating</label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary rounded"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-500 text-yellow-500"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-sm text-muted-foreground">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Great"}
                {rating === 5 && "Excellent!"}
              </p>
            )}
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Review</label>
            <Textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Tell us about your experience with this coach..."
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {reviewText.length} / 500 characters
            </p>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={handleClose}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Submit Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
