import mongoose from "mongoose";

const capitalize = (str) =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: "" },
  },
  { _id: false },
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      set: capitalize,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, index: true },
    images: [imageSchema],
    quantity: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

// runs on .save() and .create()
productSchema.pre("save", function (next) {
  if (this.isModified("name") || !this.slug) {
    this.slug = slugify(this.name);
  }
  next();
});

// runs on findOneAndUpdate / findByIdAndUpdate — NO next()
productSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate();
  if (update?.name) {
    update.slug = slugify(update.name);
  }
});



const Product = mongoose.model("Product", productSchema);
export default Product;