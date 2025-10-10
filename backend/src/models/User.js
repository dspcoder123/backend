const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50
    },
    email: { 
      type: String, 
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    mobile: { 
      type: String, 
      required: true,
      trim: true,
      match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number']
    },
    password: { 
      type: String, 
      required: true,
      minlength: 6
    },
    verified: { 
      type: Boolean, 
      default: false 
    },
    verificationToken: { 
      type: String, 
      default: null 
    },
    verificationExpires: { 
      type: Date, 
      default: null 
    },
    resetPasswordToken: { 
      type: String, 
      default: null 
    },
    resetPasswordExpires: { 
      type: Date, 
      default: null 
    }
  },
  { 
    timestamps: true,
    collection: 'users'
  }
);

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
UserSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.verificationToken;
  delete user.resetPasswordToken;
  return user;
};

module.exports = mongoose.model('User', UserSchema);
