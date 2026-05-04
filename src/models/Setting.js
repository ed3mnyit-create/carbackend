const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, 'Setting key is required'],
      unique: true,
      trim: true,
      lowercase: true
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Setting data is required']
    },
    description: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Optional: Static method to get a value by key or return fallback
settingSchema.statics.getByKey = async function(key, fallback = null) {
  const setting = await this.findOne({ key });
  return setting ? setting.data : fallback;
};

module.exports = mongoose.model('Setting', settingSchema);
