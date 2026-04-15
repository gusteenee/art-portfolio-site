import {defineField, defineType} from 'sanity'

export const artistBioType = defineType({
  name: 'artistBio',
  title: 'Artist Bio',
  type: 'document',
  fields: [
    defineField({name: 'name', title: 'Name', type: 'string'}),
    defineField({name: 'bio', title: 'Bio', type: 'text'}),
    defineField({
      name: 'profileImage',
      title: 'Profile Image',
      type: 'image',
      options: {hotspot: true},
    }),
  ],
})