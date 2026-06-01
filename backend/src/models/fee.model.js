const mongoose = require('mongoose');

const feeLineSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: [true, 'Fee category is required'],
      trim: true,
      maxlength: [80, 'Fee category cannot exceed 80 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Fee amount is required'],
      min: [0, 'Fee amount cannot be negative'],
    },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [1, 'Payment amount must be greater than 0'],
    },
    method: {
      type: String,
      enum: ['cash', 'card', 'upi', 'bank_transfer', 'cheque'],
      default: 'cash',
    },
    referenceNumber: {
      type: String,
      trim: true,
      maxlength: [80, 'Reference number cannot exceed 80 characters'],
    },
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    paidAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const feeSchema = new mongoose.Schema(
  {
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: [true, 'School is required'],
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required'],
      index: true,
    },
    receiptNumber: {
      type: String,
      required: [true, 'Receipt number is required'],
      trim: true,
      uppercase: true,
      unique: true,
      index: true,
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      match: [/^\d{4}-\d{4}$/, 'Academic year must use YYYY-YYYY format'],
      index: true,
    },
    dueDate: {
      type: Date,
    },
    lineItems: {
      type: [feeLineSchema],
      required: [true, 'Fee line items are required'],
      validate: {
        validator(items) {
          return Array.isArray(items) && items.length > 0;
        },
        message: 'At least one fee line item is required',
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total amount cannot be negative'],
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, 'Paid amount cannot be negative'],
    },
    balanceAmount: {
      type: Number,
      required: true,
      min: [0, 'Balance amount cannot be negative'],
    },
    status: {
      type: String,
      enum: ['pending', 'partial', 'paid'],
      default: 'pending',
      index: true,
    },
    payments: {
      type: [paymentSchema],
      default: [],
    },
  },
  { timestamps: true }
);

feeSchema.index({ school: 1, student: 1, academicYear: 1, status: 1 });
feeSchema.index({ school: 1, status: 1, dueDate: 1 });

module.exports = mongoose.model('Fee', feeSchema);
