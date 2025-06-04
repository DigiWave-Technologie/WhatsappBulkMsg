// Deduct credits based on category cost
const creditCost = category.creditCost || 1; // Default to 1 if not set
const creditDeduction = await Credit.findOneAndUpdate(
  { userId: req.user.userId, categoryId: category._id },
  { $inc: { credit: -creditCost } },
  { new: true }
); 