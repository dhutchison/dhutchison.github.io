require 'yaml'
require 'rubygems'
require 'stringex'
require 'jekyll'

# https://gist.github.com/stammy/790778
# Using multi-word tags support from http://tesoriere.com/2010/08/25/automatically-generated-tags-and-tag-clouds-with-jekyll--multiple-word-tags-allowed-/
# If using with jekyll gem, remove bits loop and site.read_bits('') and add require 'rubygems' and require 'jekyll'
# Using full HTML instead of layout include to manually set different page title (tag, not tag_slug) and canonical URL in header
 
 
desc 'Build tags pages'
task :build_with_tags do
    build_with_tags
end

def build_with_tags
#     sh 'rm -rf _site'
    
    puts "Generating tags..."

    include Jekyll::Filters
 
    options = Jekyll.configuration({})
    site = Jekyll::Site.new(options)
    site.process
 
    # nuke old tags pages, recreate
    FileUtils.rm_rf("tags")
    FileUtils.mkdir_p("tags")

    puts "Tags: " + site.tags.to_s
 
    site.tags.sort.each do |tag, posts|
	  # generate slug-friendly tag
      tag_slug = tag.gsub(' ','').gsub('&amp;', '&').downcase 
 
      html = <<-HTML
---
layout: tag
title: Tagged #{tag}
permalink: /archives/tags/#{tag_slug}/
tag: #{tag}
---
HTML
      File.open("tags/#{tag_slug}.html", 'w+') do |file|
        file.puts html
      end
    end
 
    puts 'Done.'
end

desc 'Build category pages'
task :build_with_categories do
    build_with_categories
end

def build_with_categories
    puts "Generating categories..."

    include Jekyll::Filters
 
    options = Jekyll.configuration({})
    site = Jekyll::Site.new(options)
    site.read_posts('')
 
    # nuke old pages, recreate
    FileUtils.rm_rf("categories")
    FileUtils.mkdir_p("categories")
    
    #Regenerate the index page
    html = <<-HTML
---
layout: main
title: Categories
---

<h2>Tags</h2>
<ul class="catList">
{% for cat in site.categories %}
	<li><a href="/categories/{{ cat | first | downcase | replace:' ','' | replace:'&amp;','&'}}">{{ cat | first }} <span>({{ cat | last | size }})</span></a></li>			
{% endfor %}
</ul>
HTML
    File.open("categories/index.html", 'w+') do |file|
        file.puts html
    end
 
    site.categories.sort.each do |cat, posts|
	  # generate slug-friendly category
      cat_slug = cat.gsub(' ','').gsub('&amp;', '&').downcase 
 
      html = <<-HTML
---
layout: main
title: In Category #{cat}
permalink: /categories/#{cat_slug}/
---
{% assign catName='#{cat_slug}' %}
{% include category_page %}
HTML
      File.open("categories/#{cat_slug}.html", 'w+') do |file|
        file.puts html
      end
    end
 
    puts 'Done.'
end


desc 'Build and send to dev server'
task :build, :opt do |t, args|
    
    
    jekyll
    puts 'Done.'
end

def jekyll
  puts 'Building Jekyll pages...'
  sh 'bundle exec jekyll build -d ../dwi_built_site --trace'
  puts 'Jekyll page build complete.'
end

task :deploy do
    upload
end

def upload
    puts 'Sending to server...'
    sh 'rsync -avz --delete ../dwi_built_site/ david@dev-lamp.local:/home/wwwroot/dwi/'
    puts 'Sent'

end

desc "Publish a draft"
task :publish, :filename do |t, args|
  # if there's a filename passed (rake publish[filename])
  # use it. Otherwise, list all available drafts in a menu
  
  source_dir = './'
  posts_dir = '_posts'
  new_post_ext = 'markdown'
  
  unless args.filename
    file = choose_file(File.join(source_dir,'_drafts'))
    Process.exit unless file # no file selected
  else
    file = args.filename if File.exists?(File.expand_path(args.filename))
    raise "Specified file not found" unless file
  end
  now = Time.now
  short_date = now.strftime("%Y-%m-%d")
  long_date = now.strftime("%Y-%m-%d %H:%M")

  # separate the YAML headers
  contents = File.read(file).split(/^---\s*$/)
  if contents.count < 3 # Expects the draft to be properly formatted
    puts "Invalid header format on post #{File.basename(file)}"
    Process.exit
  end
  # parse the YAML. So much better than regex search and replaces
  headers = YAML::load("---\n"+contents[1])
  content = contents[2].strip

  should = { :generate => false, :deploy => false, :schedule => false, :limit => 0 }

  # Check for any required YAML fields we want configured
  if headers['summary'] == nil
    print "Post is missing a summary. Please enter one: "
    summary = $stdin.gets.strip
    if summary != ''
      headers['summary'] = summary
    end
  end

  ### draft publishing ###
  # fall back to current date and title-based slug
  I18n.enforce_available_locales = false
  headers['date'] ||= long_date
  headers['slug'] ||= headers['title'].to_url.downcase

  # write out the modified YAML and post contents back to the original file
  File.open(file,'w+') {|file| file.puts YAML::dump(headers) + "---\n" + content + "\n"}
  # move the file to the posts folder with a standardized filename
  target = "#{source_dir}/#{posts_dir}/#{short_date}-#{headers['slug']}.#{new_post_ext}"
  mv file, target
  puts %Q{Published "#{headers['title']}" to #{target}}
  # deploy the site, full build
  Rake::Task[:build].invoke('all')
end

# Creates a user selection menu from directory listing
def choose_file(dir)
  puts "Choose file: #{dir}"
  @files = Dir["#{dir}/*"]
  @files.each_with_index { |f,i| puts "#{i+1}: #{f}" }
  print "> "
  num = STDIN.gets
  return false if num =~ /^[a-z ]*$/i
  file = @files[num.to_i - 1]
end

def ask(message, valid_options)
  return true if $skipask
  if valid_options
    answer = get_stdin("#{message} #{valid_options.delete_if{|opt| opt == ''}.to_s.gsub(/"/, '').gsub(/, /,'/')} ") while !valid_options.map{|opt| opt.nil? ? '' : opt.upcase }.include?(answer.nil? ? answer : answer.upcase)
  else
    answer = get_stdin(message)
  end
  answer
end
